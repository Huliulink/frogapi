package model

import (
	"errors"
	"time"
)

const (
	DbMigrationStatusPending   = 0
	DbMigrationStatusCompleted = 1
	DbMigrationStatusFailed    = 2
)

type DbMigration struct {
	Id         int    `json:"id" gorm:"primaryKey"`
	Filename   string `json:"filename" gorm:"type:varchar(255);not null"`
	SqlContent string `json:"sql_content" gorm:"type:text;not null"`
	Status     int    `json:"status" gorm:"type:int;default:0;not null;index"`
	ErrorMsg   string `json:"error_msg" gorm:"type:text"`
	ExecutedAt int64  `json:"executed_at"`
	CreatedAt  int64  `json:"created_at" gorm:"autoCreateTime"`
}

func GetPendingDbMigrations() ([]*DbMigration, error) {
	var migrations []*DbMigration
	err := DB.Where("status = ?", DbMigrationStatusPending).Order("id asc").Find(&migrations).Error
	return migrations, err
}

func GetDbMigrationHistory() ([]*DbMigration, error) {
	var migrations []*DbMigration
	err := DB.Where("status IN ?", []int{DbMigrationStatusCompleted, DbMigrationStatusFailed}).Order("executed_at desc").Find(&migrations).Error
	return migrations, err
}

func GetDbMigrationById(id int) (*DbMigration, error) {
	var migration DbMigration
	err := DB.First(&migration, "id = ?", id).Error
	return &migration, err
}

func CreateDbMigration(m *DbMigration) error {
	return DB.Create(m).Error
}

func DeletePendingDbMigration(id int) error {
	result := DB.Where("id = ? AND status = ?", id, DbMigrationStatusPending).Delete(&DbMigration{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("记录不存在或已执行")
	}
	return nil
}

func UpdateDbMigrationStatus(id int, status int, errorMsg string) error {
	updates := map[string]interface{}{
		"status":    status,
		"error_msg": errorMsg,
	}
	if status != DbMigrationStatusPending {
		updates["executed_at"] = time.Now().Unix()
	}
	return DB.Model(&DbMigration{}).Where("id = ?", id).Updates(updates).Error
}

func ExecuteDbMigrationSQL(migration *DbMigration) error {
	tx := DB.Begin()
	if tx.Error != nil {
		UpdateDbMigrationStatus(migration.Id, DbMigrationStatusFailed, tx.Error.Error())
		return tx.Error
	}

	if err := tx.Exec(migration.SqlContent).Error; err != nil {
		tx.Rollback()
		UpdateDbMigrationStatus(migration.Id, DbMigrationStatusFailed, err.Error())
		return err
	}

	if err := tx.Commit().Error; err != nil {
		UpdateDbMigrationStatus(migration.Id, DbMigrationStatusFailed, err.Error())
		return err
	}

	UpdateDbMigrationStatus(migration.Id, DbMigrationStatusCompleted, "")
	return nil
}

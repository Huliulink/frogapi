package controller

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

const maxSQLFileSize = 1 << 20 // 1MB

func GetPendingDbMigrations(c *gin.Context) {
	migrations, err := model.GetPendingDbMigrations()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    migrations,
	})
}

func GetDbMigrationHistory(c *gin.Context) {
	migrations, err := model.GetDbMigrationHistory()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    migrations,
	})
}

func UploadDbMigration(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgDbMigrationInvalidFile)
		return
	}
	defer file.Close()

	// 校验文件后缀
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".sql" {
		common.ApiErrorI18n(c, i18n.MsgDbMigrationInvalidFile)
		return
	}

	// 校验文件大小
	if header.Size > maxSQLFileSize {
		common.ApiErrorI18n(c, i18n.MsgDbMigrationFileTooLarge)
		return
	}

	content, err := io.ReadAll(file)
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgDbMigrationInvalidFile)
		return
	}

	sqlContent := strings.TrimSpace(string(content))
	if sqlContent == "" {
		common.ApiErrorI18n(c, i18n.MsgDbMigrationInvalidFile)
		return
	}

	migration := &model.DbMigration{
		Filename:   header.Filename,
		SqlContent: sqlContent,
		Status:     model.DbMigrationStatusPending,
	}
	if err := model.CreateDbMigration(migration); err != nil {
		common.ApiError(c, err)
		return
	}

	common.SysLog(fmt.Sprintf("数据库更新文件已上传: %s", header.Filename))
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": i18n.T(c, i18n.MsgDbMigrationUploadSuccess),
	})
}

func ExecuteDbMigration(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}

	migration, err := model.GetDbMigrationById(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	if migration.Status != model.DbMigrationStatusPending {
		common.ApiErrorI18n(c, i18n.MsgDbMigrationNotPending)
		return
	}

	if err := model.ExecuteDbMigrationSQL(migration); err != nil {
		common.SysLog(fmt.Sprintf("数据库更新执行失败: %s, 错误: %s", migration.Filename, err.Error()))
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": fmt.Sprintf("%s: %s", i18n.T(c, i18n.MsgDbMigrationExecuteFailed), err.Error()),
		})
		return
	}

	common.SysLog(fmt.Sprintf("数据库更新执行成功: %s", migration.Filename))
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": i18n.T(c, i18n.MsgDbMigrationExecuteSuccess),
	})
}

func ExecuteAllDbMigrations(c *gin.Context) {
	migrations, err := model.GetPendingDbMigrations()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	if len(migrations) == 0 {
		common.ApiErrorI18n(c, i18n.MsgDbMigrationNotPending)
		return
	}

	var executed, failed int
	for _, migration := range migrations {
		if err := model.ExecuteDbMigrationSQL(migration); err != nil {
			common.SysLog(fmt.Sprintf("数据库更新执行失败: %s, 错误: %s", migration.Filename, err.Error()))
			failed++
			break // 遇到失败停止
		}
		common.SysLog(fmt.Sprintf("数据库更新执行成功: %s", migration.Filename))
		executed++
	}

	if failed > 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": fmt.Sprintf("执行了 %d 条，失败 %d 条", executed, failed),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("成功执行 %d 条更新", executed),
	})
}

func DeleteDbMigration(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgInvalidParams)
		return
	}

	if err := model.DeletePendingDbMigration(id); err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

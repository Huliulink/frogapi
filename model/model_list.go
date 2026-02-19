package model

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

// ModelListEndpoint 模型列表端点
type ModelListEndpoint struct {
	Id        int     `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string  `json:"name" gorm:"type:varchar(100);not null"`
	URL       string  `json:"url" gorm:"type:varchar(500)"`
	Ratio     float64 `json:"ratio" gorm:"default:1"`
	Icon      string  `json:"icon" gorm:"type:varchar(500)"`
	SortOrder int     `json:"sort_order" gorm:"default:0"`
	Status    int     `json:"status" gorm:"default:1"`
	CreatedAt int64   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt int64   `json:"updated_at" gorm:"autoUpdateTime"`
}

// ModelListItem 模型列表项
type ModelListItem struct {
	Id                  int     `json:"id" gorm:"primaryKey;autoIncrement"`
	EndpointId          int     `json:"endpoint_id" gorm:"index;not null"`
	ModelName           string  `json:"model_name" gorm:"type:varchar(200);not null"`
	Icon                string  `json:"icon" gorm:"type:varchar(500)"`
	OfficialInputPrice  float64 `json:"official_input_price" gorm:"default:0"`
	OfficialOutputPrice float64 `json:"official_output_price" gorm:"default:0"`
	SiteInputPrice      float64 `json:"site_input_price" gorm:"default:0"`
	SiteOutputPrice     float64 `json:"site_output_price" gorm:"default:0"`
	Status              int     `json:"status" gorm:"default:1"`
	SortOrder           int     `json:"sort_order" gorm:"default:0"`
	CreatedAt           int64   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           int64   `json:"updated_at" gorm:"autoUpdateTime"`
}

// ModelListEndpointWithModels 端点及其模型（用于用户端返回）
type ModelListEndpointWithModels struct {
	ModelListEndpoint
	Models []ModelListItem `json:"models"`
}

func GetAllModelListEndpoints() ([]ModelListEndpoint, error) {
	var endpoints []ModelListEndpoint
	err := DB.Order("sort_order ASC, id ASC").Find(&endpoints).Error
	return endpoints, err
}

func GetEnabledModelListEndpointsWithModels() ([]ModelListEndpointWithModels, error) {
	var endpoints []ModelListEndpoint
	err := DB.Where("status = ?", 1).Order("sort_order ASC, id ASC").Find(&endpoints).Error
	if err != nil {
		return nil, err
	}
	result := make([]ModelListEndpointWithModels, 0, len(endpoints))
	for _, ep := range endpoints {
		var models []ModelListItem
		err = DB.Where("endpoint_id = ? AND status = ?", ep.Id, 1).
			Order("sort_order ASC, id ASC").Find(&models).Error
		if err != nil {
			return nil, err
		}
		result = append(result, ModelListEndpointWithModels{
			ModelListEndpoint: ep,
			Models:            models,
		})
	}
	return result, nil
}

func GetModelListEndpointById(id int) (*ModelListEndpoint, error) {
	var endpoint ModelListEndpoint
	err := DB.First(&endpoint, id).Error
	return &endpoint, err
}

func CreateModelListEndpoint(endpoint *ModelListEndpoint) error {
	return DB.Create(endpoint).Error
}

func UpdateModelListEndpoint(endpoint *ModelListEndpoint) error {
	return DB.Save(endpoint).Error
}

func DeleteModelListEndpoint(id int) error {
	// 删除端点下的所有模型
	err := DB.Where("endpoint_id = ?", id).Delete(&ModelListItem{}).Error
	if err != nil {
		return err
	}
	return DB.Delete(&ModelListEndpoint{}, id).Error
}

func GetModelListItemsByEndpointId(endpointId int) ([]ModelListItem, error) {
	var items []ModelListItem
	err := DB.Where("endpoint_id = ?", endpointId).
		Order("sort_order ASC, id ASC").Find(&items).Error
	return items, err
}

func CreateModelListItem(item *ModelListItem) error {
	return DB.Create(item).Error
}

func UpdateModelListItem(item *ModelListItem) error {
	return DB.Save(item).Error
}

func DeleteModelListItem(id int) error {
	return DB.Delete(&ModelListItem{}, id).Error
}

// SyncModelList 从现有渠道和定价数据同步模型列表
func SyncModelList() (int, int, error) {
	pricing := GetPricing()
	if len(pricing) == 0 {
		return 0, 0, fmt.Errorf("no pricing data available")
	}

	// 获取供应商信息
	vendors := GetVendors()
	vendorMap := make(map[int]PricingVendor)
	for _, v := range vendors {
		vendorMap[v.ID] = v
	}

	// 按供应商分组模型
	vendorModels := make(map[int][]Pricing)
	noVendorModels := make([]Pricing, 0)
	for _, p := range pricing {
		if p.VendorID > 0 {
			vendorModels[p.VendorID] = append(vendorModels[p.VendorID], p)
		} else {
			noVendorModels = append(noVendorModels, p)
		}
	}

	// 获取现有端点映射（按名称）
	var existingEndpoints []ModelListEndpoint
	DB.Find(&existingEndpoints)
	endpointNameMap := make(map[string]*ModelListEndpoint)
	for i := range existingEndpoints {
		endpointNameMap[existingEndpoints[i].Name] = &existingEndpoints[i]
	}

	endpointCount := 0
	modelCount := 0

	// 为每个供应商创建/更新端点
	for vendorID, models := range vendorModels {
		vendor, ok := vendorMap[vendorID]
		if !ok {
			continue
		}
		ep, exists := endpointNameMap[vendor.Name]
		if !exists {
			ep = &ModelListEndpoint{
				Name:   vendor.Name,
				Icon:   vendor.Icon,
				Status: 1,
			}
			if err := CreateModelListEndpoint(ep); err != nil {
				common.SysLog(fmt.Sprintf("SyncModelList: create endpoint %s failed: %v", vendor.Name, err))
				continue
			}
			endpointCount++
		}
		modelCount += syncModelsForEndpoint(ep.Id, models)
	}

	// 处理无供应商的模型 -> 放入 "Other" 端点
	if len(noVendorModels) > 0 {
		ep, exists := endpointNameMap["Other"]
		if !exists {
			ep = &ModelListEndpoint{
				Name:      "Other",
				Status:    1,
				SortOrder: 9999,
			}
			if err := CreateModelListEndpoint(ep); err != nil {
				common.SysLog(fmt.Sprintf("SyncModelList: create Other endpoint failed: %v", err))
			} else {
				endpointCount++
				modelCount += syncModelsForEndpoint(ep.Id, noVendorModels)
			}
		} else {
			modelCount += syncModelsForEndpoint(ep.Id, noVendorModels)
		}
	}

	return endpointCount, modelCount, nil
}

func syncModelsForEndpoint(endpointId int, models []Pricing) int {
	// 获取该端点下已有的模型
	var existingItems []ModelListItem
	DB.Where("endpoint_id = ?", endpointId).Find(&existingItems)
	existingMap := make(map[string]bool)
	for _, item := range existingItems {
		existingMap[item.ModelName] = true
	}

	count := 0
	for _, p := range models {
		modelName := strings.TrimSpace(p.ModelName)
		if modelName == "" || existingMap[modelName] {
			continue
		}

		var siteInputPrice, siteOutputPrice float64
		modelPrice, findPrice := ratio_setting.GetModelPrice(modelName, false)
		if findPrice {
			siteInputPrice = modelPrice
			siteOutputPrice = modelPrice
		} else {
			modelRatio, _, _ := ratio_setting.GetModelRatio(modelName)
			completionRatio := ratio_setting.GetCompletionRatio(modelName)
			// 1 ratio = $0.002/1K tokens = $2/1M tokens
			siteInputPrice = modelRatio * 2.0
			siteOutputPrice = modelRatio * 2.0 * completionRatio
		}

		item := &ModelListItem{
			EndpointId:      endpointId,
			ModelName:       modelName,
			Icon:            p.Icon,
			SiteInputPrice:  siteInputPrice,
			SiteOutputPrice: siteOutputPrice,
			Status:          1,
		}
		if err := CreateModelListItem(item); err != nil {
			common.SysLog(fmt.Sprintf("SyncModelList: create model %s failed: %v", modelName, err))
			continue
		}
		count++
	}
	return count
}

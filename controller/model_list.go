package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GetModelList 用户端：获取所有启用的端点及其模型
func GetModelList(c *gin.Context) {
	data, err := model.GetEnabledModelListEndpointsWithModels()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, data)
}

// GetModelListEndpoints 管理端：获取所有端点
func GetModelListEndpoints(c *gin.Context) {
	endpoints, err := model.GetAllModelListEndpoints()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, endpoints)
}

// CreateModelListEndpoint 创建端点
func CreateModelListEndpoint(c *gin.Context) {
	var endpoint model.ModelListEndpoint
	if err := c.ShouldBindJSON(&endpoint); err != nil {
		common.ApiErrorMsg(c, "无效的请求参数")
		return
	}
	if endpoint.Name == "" {
		common.ApiErrorMsg(c, "端点名称不能为空")
		return
	}
	endpoint.Id = 0
	if err := model.CreateModelListEndpoint(&endpoint); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, endpoint)
}

// UpdateModelListEndpoint 更新端点
func UpdateModelListEndpoint(c *gin.Context) {
	var endpoint model.ModelListEndpoint
	if err := c.ShouldBindJSON(&endpoint); err != nil {
		common.ApiErrorMsg(c, "无效的请求参数")
		return
	}
	if endpoint.Id == 0 {
		common.ApiErrorMsg(c, "端点ID不能为空")
		return
	}
	if err := model.UpdateModelListEndpoint(&endpoint); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, endpoint)
}

// DeleteModelListEndpoint 删除端点
func DeleteModelListEndpoint(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiErrorMsg(c, "无效的端点ID")
		return
	}
	if err := model.DeleteModelListEndpoint(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GetModelListEndpointModels 获取端点下的模型
func GetModelListEndpointModels(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiErrorMsg(c, "无效的端点ID")
		return
	}
	items, err := model.GetModelListItemsByEndpointId(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, items)
}

// CreateModelListItem 创建模型项
func CreateModelListItem(c *gin.Context) {
	var item model.ModelListItem
	if err := c.ShouldBindJSON(&item); err != nil {
		common.ApiErrorMsg(c, "无效的请求参数")
		return
	}
	if item.ModelName == "" {
		common.ApiErrorMsg(c, "模型名称不能为空")
		return
	}
	if item.EndpointId == 0 {
		common.ApiErrorMsg(c, "端点ID不能为空")
		return
	}
	item.Id = 0
	if err := model.CreateModelListItem(&item); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, item)
}

// UpdateModelListItem 更新模型项
func UpdateModelListItem(c *gin.Context) {
	var item model.ModelListItem
	if err := c.ShouldBindJSON(&item); err != nil {
		common.ApiErrorMsg(c, "无效的请求参数")
		return
	}
	if item.Id == 0 {
		common.ApiErrorMsg(c, "模型ID不能为空")
		return
	}
	if err := model.UpdateModelListItem(&item); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, item)
}

// DeleteModelListItem 删除模型项
func DeleteModelListItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiErrorMsg(c, "无效的模型ID")
		return
	}
	if err := model.DeleteModelListItem(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// SyncModelList 从现有渠道数据同步模型列表
func SyncModelList(c *gin.Context) {
	endpointCount, modelCount, err := model.SyncModelList()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"endpoint_count": endpointCount,
		"model_count":    modelCount,
	})
}

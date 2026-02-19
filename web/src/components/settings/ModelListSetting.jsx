import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Table,
  Modal,
  Form,
  Tag,
  Space,
  Popconfirm,
} from '@douyinfe/semi-ui';
import { Plus, RefreshCw, Trash2, Edit3 } from 'lucide-react';
import { API, showError, showSuccess } from '../../helpers';

const ModelListSetting = () => {
  const { t } = useTranslation();
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [endpointModalVisible, setEndpointModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [editingModel, setEditingModel] = useState(null);

  const loadEndpoints = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/model-list/admin/endpoints');
      if (res.data.success) {
        setEndpoints(res.data.data || []);
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
    setLoading(false);
  };

  const loadModels = async (endpointId) => {
    try {
      const res = await API.get(`/api/model-list/admin/endpoints/${endpointId}/models`);
      if (res.data.success) {
        setModels(res.data.data || []);
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  useEffect(() => {
    loadEndpoints();
  }, []);

  useEffect(() => {
    if (selectedEndpoint) {
      loadModels(selectedEndpoint.id);
    } else {
      setModels([]);
    }
  }, [selectedEndpoint]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await API.post('/api/model-list/admin/sync');
      if (res.data.success) {
        const data = res.data.data;
        showSuccess(t('同步成功') + `: ${data.endpoint_count} ${t('个端点')}, ${data.model_count} ${t('个模型')}`);
        loadEndpoints();
        if (selectedEndpoint) {
          loadModels(selectedEndpoint.id);
        }
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
    setSyncing(false);
  };

  const handleSaveEndpoint = async (values) => {
    try {
      const data = { ...values, status: values.status ? 1 : 0 };
      let res;
      if (editingEndpoint?.id) {
        data.id = editingEndpoint.id;
        res = await API.put('/api/model-list/admin/endpoints', data);
      } else {
        res = await API.post('/api/model-list/admin/endpoints', data);
      }
      if (res.data.success) {
        showSuccess(t('保存成功'));
        setEndpointModalVisible(false);
        setEditingEndpoint(null);
        loadEndpoints();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteEndpoint = async (id) => {
    try {
      const res = await API.delete(`/api/model-list/admin/endpoints/${id}`);
      if (res.data.success) {
        showSuccess(t('删除成功'));
        if (selectedEndpoint?.id === id) {
          setSelectedEndpoint(null);
        }
        loadEndpoints();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleSaveModel = async (values) => {
    try {
      const data = { ...values, status: values.status ? 1 : 0, endpoint_id: selectedEndpoint.id };
      let res;
      if (editingModel?.id) {
        data.id = editingModel.id;
        res = await API.put('/api/model-list/admin/models', data);
      } else {
        res = await API.post('/api/model-list/admin/models', data);
      }
      if (res.data.success) {
        showSuccess(t('保存成功'));
        setModelModalVisible(false);
        setEditingModel(null);
        loadModels(selectedEndpoint.id);
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteModel = async (id) => {
    try {
      const res = await API.delete(`/api/model-list/admin/models/${id}`);
      if (res.data.success) {
        showSuccess(t('删除成功'));
        loadModels(selectedEndpoint.id);
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const endpointColumns = [
    { title: t('名称'), dataIndex: 'name', key: 'name' },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
    {
      title: t('倍率'),
      dataIndex: 'ratio',
      key: 'ratio',
      width: 80,
    },
    {
      title: t('排序'),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 60,
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'} size='small'>
          {status === 1 ? t('启用') : t('禁用')}
        </Tag>
      ),
    },
    {
      title: t('操作'),
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size='small'
            theme='light'
            onClick={() => {
              setSelectedEndpoint(record);
            }}
          >
            {t('查看模型')}
          </Button>
          <Button
            size='small'
            icon={<Edit3 size={14} />}
            onClick={() => {
              setEditingEndpoint(record);
              setEndpointModalVisible(true);
            }}
          />
          <Popconfirm
            title={t('确认删除？')}
            onConfirm={() => handleDeleteEndpoint(record.id)}
          >
            <Button size='small' type='danger' icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const modelColumns = [
    { title: t('模型名称'), dataIndex: 'model_name', key: 'model_name' },
    {
      title: t('官方输入价格'),
      dataIndex: 'official_input_price',
      key: 'official_input_price',
      width: 120,
      render: (v) => (v ? `$${v}` : '-'),
    },
    {
      title: t('官方输出价格'),
      dataIndex: 'official_output_price',
      key: 'official_output_price',
      width: 120,
      render: (v) => (v ? `$${v}` : '-'),
    },
    {
      title: t('本站输入价格'),
      dataIndex: 'site_input_price',
      key: 'site_input_price',
      width: 120,
      render: (v) => (v ? `$${v.toFixed(4)}` : '-'),
    },
    {
      title: t('本站输出价格'),
      dataIndex: 'site_output_price',
      key: 'site_output_price',
      width: 120,
      render: (v) => (v ? `$${v.toFixed(4)}` : '-'),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'} size='small'>
          {status === 1 ? t('可用') : t('不可用')}
        </Tag>
      ),
    },
    {
      title: t('操作'),
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            size='small'
            icon={<Edit3 size={14} />}
            onClick={() => {
              setEditingModel(record);
              setModelModalVisible(true);
            }}
          />
          <Popconfirm
            title={t('确认删除？')}
            onConfirm={() => handleDeleteModel(record.id)}
          >
            <Button size='small' type='danger' icon={<Trash2 size={14} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <Space>
          <Button
            icon={<RefreshCw size={14} />}
            loading={syncing}
            onClick={handleSync}
          >
            {t('同步模型列表')}
          </Button>
          <Button
            icon={<Plus size={14} />}
            theme='solid'
            onClick={() => {
              setEditingEndpoint(null);
              setEndpointModalVisible(true);
            }}
          >
            {t('添加端点')}
          </Button>
        </Space>
      </div>

      <Table
        columns={endpointColumns}
        dataSource={endpoints}
        rowKey='id'
        loading={loading}
        pagination={false}
        size='small'
        empty={t('暂无端点数据，请点击同步按钮')}
      />

      {selectedEndpoint && (
        <div className='mt-6'>
          <div className='flex items-center justify-between mb-3'>
            <span className='font-medium'>
              {selectedEndpoint.name} - {t('模型列表')}
            </span>
            <Button
              size='small'
              icon={<Plus size={14} />}
              onClick={() => {
                setEditingModel(null);
                setModelModalVisible(true);
              }}
            >
              {t('添加模型')}
            </Button>
          </div>
          <Table
            columns={modelColumns}
            dataSource={models}
            rowKey='id'
            pagination={{ pageSize: 20 }}
            size='small'
            empty={t('暂无模型数据')}
          />
        </div>
      )}

      {/* 端点编辑弹窗 */}
      <Modal
        title={editingEndpoint?.id ? t('编辑端点') : t('添加端点')}
        visible={endpointModalVisible}
        onCancel={() => {
          setEndpointModalVisible(false);
          setEditingEndpoint(null);
        }}
        footer={null}
      >
        <Form
          initValues={editingEndpoint || { status: true, ratio: 1, sort_order: 0 }}
          onSubmit={handleSaveEndpoint}
        >
          <Form.Input field='name' label={t('端点名称')} rules={[{ required: true }]} />
          <Form.Input field='url' label={t('端点URL')} />
          <Form.InputNumber field='ratio' label={t('计费倍率')} min={0} step={0.1} />
          <Form.Input field='icon' label={t('图标')} placeholder='e.g. OpenAI.Color' />
          <Form.InputNumber field='sort_order' label={t('排序')} min={0} />
          <Form.Switch field='status' label={t('启用')} />
          <Button htmlType='submit' theme='solid' className='mt-2'>
            {t('保存')}
          </Button>
        </Form>
      </Modal>

      {/* 模型编辑弹窗 */}
      <Modal
        title={editingModel?.id ? t('编辑模型') : t('添加模型')}
        visible={modelModalVisible}
        onCancel={() => {
          setModelModalVisible(false);
          setEditingModel(null);
        }}
        footer={null}
      >
        <Form
          initValues={editingModel || { status: true, sort_order: 0 }}
          onSubmit={handleSaveModel}
        >
          <Form.Input field='model_name' label={t('模型名称')} rules={[{ required: true }]} />
          <Form.InputNumber field='official_input_price' label={t('官方输入价格') + ' ($/1M tokens)'} min={0} step={0.01} />
          <Form.InputNumber field='official_output_price' label={t('官方输出价格') + ' ($/1M tokens)'} min={0} step={0.01} />
          <Form.InputNumber field='site_input_price' label={t('本站输入价格') + ' ($/1M tokens)'} min={0} step={0.01} />
          <Form.InputNumber field='site_output_price' label={t('本站输出价格') + ' ($/1M tokens)'} min={0} step={0.01} />
          <Form.InputNumber field='sort_order' label={t('排序')} min={0} />
          <Form.Switch field='status' label={t('可用')} />
          <Button htmlType='submit' theme='solid' className='mt-2'>
            {t('保存')}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ModelListSetting;

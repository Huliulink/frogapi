import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Modal,
  Table,
  Tag,
  Upload,
  Typography,
  Space,
  Popconfirm,
} from '@douyinfe/semi-ui';
import { IconUpload, IconDelete, IconPlay } from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '../../helpers';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const DatabaseUpdateSetting = () => {
  const { t } = useTranslation();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executeLoading, setExecuteLoading] = useState({});
  const [executeAllLoading, setExecuteAllLoading] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await API.get('/api/db-migration/pending');
      if (res.data.success) {
        setPending(res.data.data || []);
      }
    } catch (e) {
      showError(t('获取待执行列表失败'));
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/db-migration/history');
      if (res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (e) {
      showError(t('获取历史记录失败'));
    }
  };

  const refresh = () => {
    fetchPending();
    fetchHistory();
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file.fileInstance);
    setLoading(true);
    try {
      const res = await API.post('/api/db-migration/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        showSuccess(res.data.message || t('上传成功'));
        onSuccess();
        refresh();
      } else {
        showError(res.data.message);
        onError();
      }
    } catch (e) {
      showError(t('上传失败'));
      onError();
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = (id) => {
    Modal.confirm({
      title: t('确认执行'),
      content: t('SQL 将直接在数据库上执行，此操作不可撤销，确认继续？'),
      onOk: async () => {
        setExecuteLoading((prev) => ({ ...prev, [id]: true }));
        try {
          const res = await API.post(`/api/db-migration/execute/${id}`);
          if (res.data.success) {
            showSuccess(res.data.message);
          } else {
            showError(res.data.message);
          }
          refresh();
        } catch (e) {
          showError(t('执行失败'));
        } finally {
          setExecuteLoading((prev) => ({ ...prev, [id]: false }));
        }
      },
    });
  };

  const handleExecuteAll = () => {
    Modal.confirm({
      title: t('确认全部执行'),
      content: t('将按顺序执行所有待执行的 SQL 文件，遇到错误将停止，确认继续？'),
      onOk: async () => {
        setExecuteAllLoading(true);
        try {
          const res = await API.post('/api/db-migration/execute');
          if (res.data.success) {
            showSuccess(res.data.message);
          } else {
            showError(res.data.message);
          }
          refresh();
        } catch (e) {
          showError(t('执行失败'));
        } finally {
          setExecuteAllLoading(false);
        }
      },
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await API.delete(`/api/db-migration/${id}`);
      if (res.data.success) {
        showSuccess(t('删除成功'));
        refresh();
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(t('删除失败'));
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString();
  };

  const pendingColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: t('文件名'), dataIndex: 'filename' },
    {
      title: t('上传时间'),
      dataIndex: 'created_at',
      render: (text) => formatTime(text),
    },
    {
      title: t('操作'),
      dataIndex: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            size='small'
            type='primary'
            icon={<IconPlay />}
            loading={executeLoading[record.id]}
            onClick={() => handleExecute(record.id)}
          >
            {t('执行')}
          </Button>
          <Popconfirm
            title={t('确认删除？')}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size='small' type='danger' icon={<IconDelete />}>
              {t('删除')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: t('文件名'), dataIndex: 'filename' },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 100,
      render: (status) =>
        status === 1 ? (
          <Tag color='green'>{t('成功')}</Tag>
        ) : (
          <Tag color='red'>{t('失败')}</Tag>
        ),
    },
    {
      title: t('执行时间'),
      dataIndex: 'executed_at',
      render: (text) => formatTime(text),
    },
    {
      title: t('错误信息'),
      dataIndex: 'error_msg',
      render: (text) =>
        text ? (
          <Text
            type='danger'
            ellipsis={{ showTooltip: true }}
            style={{ maxWidth: 300 }}
          >
            {text}
          </Text>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div>
      <Card
        title={t('待执行更新')}
        style={{ marginTop: 10 }}
        headerExtraContent={
          <Space>
            <Upload
              accept='.sql'
              customRequest={handleUpload}
              showUploadList={false}
              limit={1}
            >
              <Button
                icon={<IconUpload />}
                loading={loading}
                theme='light'
              >
                {t('上传SQL文件')}
              </Button>
            </Upload>
            {pending.length > 0 && (
              <Button
                type='primary'
                icon={<IconPlay />}
                loading={executeAllLoading}
                onClick={handleExecuteAll}
              >
                {t('全部执行')}
              </Button>
            )}
          </Space>
        }
      >
        <Table
          columns={pendingColumns}
          dataSource={pending}
          rowKey='id'
          pagination={false}
          empty={<Text type='tertiary'>{t('暂无待执行的更新')}</Text>}
          size='small'
        />
      </Card>

      <Card title={t('执行历史')} style={{ marginTop: 10 }}>
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey='id'
          pagination={{ pageSize: 10 }}
          empty={<Text type='tertiary'>{t('暂无执行历史')}</Text>}
          size='small'
        />
      </Card>
    </div>
  );
};

export default DatabaseUpdateSetting;

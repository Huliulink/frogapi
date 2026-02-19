import React, { useMemo } from 'react';
import { Table, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const ModelListTable = ({ endpoints, selectedEndpointId, currency, exchangeRate }) => {
  const { t } = useTranslation();

  const formatPrice = (price) => {
    if (!price || price === 0) return '-';
    const converted = currency === 'CNY' ? price * exchangeRate : price;
    const symbol = currency === 'CNY' ? '¥' : '$';
    return `${symbol}${converted.toFixed(4)}`;
  };

  const models = useMemo(() => {
    const result = [];
    const filteredEndpoints = selectedEndpointId
      ? endpoints.filter((ep) => ep.id === selectedEndpointId)
      : endpoints;

    filteredEndpoints.forEach((ep) => {
      if (ep.models) {
        ep.models.forEach((model) => {
          result.push({
            ...model,
            endpoint_name: ep.name,
            endpoint_icon: ep.icon,
          });
        });
      }
    });
    return result;
  }, [endpoints, selectedEndpointId]);

  const columns = [
    {
      title: t('模型名称'),
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text) => (
        <span className='font-medium text-sm'>{text}</span>
      ),
    },
    {
      title: t('端点'),
      dataIndex: 'endpoint_name',
      key: 'endpoint_name',
      render: (text) => (
        <Tag size='small' color='blue'>
          {text}
        </Tag>
      ),
    },
    {
      title: t('官方输入价格'),
      dataIndex: 'official_input_price',
      key: 'official_input_price',
      render: (price) => formatPrice(price),
      align: 'right',
    },
    {
      title: t('官方输出价格'),
      dataIndex: 'official_output_price',
      key: 'official_output_price',
      render: (price) => formatPrice(price),
      align: 'right',
    },
    {
      title: t('本站输入价格'),
      dataIndex: 'site_input_price',
      key: 'site_input_price',
      render: (price) => (
        <span style={{ color: 'var(--semi-color-success)' }}>
          {formatPrice(price)}
        </span>
      ),
      align: 'right',
    },
    {
      title: t('本站输出价格'),
      dataIndex: 'site_output_price',
      key: 'site_output_price',
      render: (price) => (
        <span style={{ color: 'var(--semi-color-success)' }}>
          {formatPrice(price)}
        </span>
      ),
      align: 'right',
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'} size='small'>
          {status === 1 ? t('可用') : t('不可用')}
        </Tag>
      ),
      width: 80,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={models}
      rowKey='id'
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        pageSizeOpts: [10, 20, 50, 100],
      }}
      size='small'
      empty={t('暂无模型数据')}
    />
  );
};

export default ModelListTable;

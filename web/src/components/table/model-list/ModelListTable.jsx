import React from 'react';
import { Table, Tag, RadioGroup, Radio, Banner, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Layers, Copy } from 'lucide-react';
import { getLobeHubIcon } from '../../../helpers/render';

const ModelListTable = ({
  endpoint,
  models,
  priceType,
  onPriceTypeChange,
  currency,
  onCurrencyChange,
  exchangeRate,
}) => {
  const { t } = useTranslation();

  const formatPrice = (price) => {
    if (!price || price === 0) return '-';
    const converted = currency === 'CNY' ? price * exchangeRate : price;
    const symbol = currency === 'CNY' ? '¥' : '$';
    return `${symbol}${converted.toFixed(2)}/M`;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      Toast.success(t('已复制'));
    });
  };

  const inputKey = priceType === 'official' ? 'official_input_price' : 'site_input_price';
  const outputKey = priceType === 'official' ? 'official_output_price' : 'site_output_price';

  const columns = [
    {
      title: t('模型'),
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text, record) => (
        <div className='flex items-center gap-2'>
          <span className='flex-shrink-0'>
            {record.icon ? getLobeHubIcon(record.icon, 20) : getLobeHubIcon('Layers', 20)}
          </span>
          <span className='font-medium text-sm truncate'>{text}</span>
          <button
            className='flex-shrink-0 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer'
            style={{ border: 'none', background: 'none', color: 'var(--semi-color-text-2)' }}
            onClick={(e) => {
              e.stopPropagation();
              handleCopy(text);
            }}
            title={t('复制模型名称')}
          >
            <Copy size={14} />
          </button>
        </div>
      ),
    },
    {
      title: t('输入价格'),
      dataIndex: inputKey,
      key: 'input_price',
      render: (price) => (
        <span style={{ color: 'var(--semi-color-text-0)' }}>{formatPrice(price)}</span>
      ),
      align: 'right',
      width: 140,
    },
    {
      title: t('输出价格'),
      dataIndex: outputKey,
      key: 'output_price',
      render: (price) => (
        <span style={{ color: 'var(--semi-color-success)' }}>{formatPrice(price)}</span>
      ),
      align: 'right',
      width: 140,
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
      align: 'center',
    },
  ];

  if (!endpoint) {
    return (
      <div className='flex items-center justify-center' style={{ height: 300, color: 'var(--semi-color-text-2)' }}>
        {t('请选择一个分组')}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        className='flex items-center justify-between px-4 py-3'
        style={{ borderBottom: '1px solid var(--semi-color-border)' }}
      >
        <div className='flex items-center gap-2'>
          <Layers size={16} style={{ color: 'var(--semi-color-primary)' }} />
          <span className='text-sm font-semibold' style={{ color: 'var(--semi-color-text-0)' }}>
            {endpoint.name}
          </span>
        </div>
      </div>

      {/* Toggles */}
      <div className='flex items-center justify-between px-4 py-3'>
        <RadioGroup
          type='button'
          size='small'
          value={priceType}
          onChange={(e) => onPriceTypeChange(e.target.value)}
        >
          <Radio value='official'>{t('官方价格')}</Radio>
          <Radio value='site'>{t('本站价格')}</Radio>
        </RadioGroup>

        <RadioGroup
          type='button'
          size='small'
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
        >
          <Radio value='USD'>$</Radio>
          <Radio value='CNY'>¥</Radio>
        </RadioGroup>
      </div>

      {/* Info banner */}
      {endpoint.url && (
        <div className='px-4 pb-2'>
          <Banner
            type='info'
            description={`${t('端点URL')}: ${endpoint.url}${endpoint.ratio && endpoint.ratio !== 1 ? ` | ${t('计费倍率')}: ${endpoint.ratio}x` : ''}`}
            closeIcon={null}
          />
        </div>
      )}

      {/* Table */}
      <div className='px-2'>
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
      </div>
    </div>
  );
};

export default ModelListTable;

import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Spin, Typography } from '@douyinfe/semi-ui';
import { API, showError } from '../../../helpers';
import { StatusContext } from '../../../context/Status';
import EndpointSidebar from './EndpointSidebar';
import ModelListTable from './ModelListTable';
import CurrencyToggle from './CurrencyToggle';

const ModelListPage = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');

  const exchangeRate = statusState?.status?.usd_exchange_rate || 7;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/model-list/');
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

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className='mt-[60px] px-2'>
      <Layout>
        <Layout.Content>
          <div className='flex items-center justify-between mb-4'>
            <Typography.Title heading={5}>{t('模型列表')}</Typography.Title>
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
          <Spin spinning={loading}>
            <div className='flex gap-4' style={{ minHeight: 400 }}>
              <div
                className='flex-shrink-0 overflow-y-auto rounded-lg'
                style={{
                  width: 220,
                  maxHeight: 'calc(100vh - 200px)',
                  border: '1px solid var(--semi-color-border)',
                }}
              >
                <EndpointSidebar
                  endpoints={endpoints}
                  selectedId={selectedEndpointId}
                  onSelect={setSelectedEndpointId}
                />
              </div>
              <div className='flex-1 min-w-0'>
                <ModelListTable
                  endpoints={endpoints}
                  selectedEndpointId={selectedEndpointId}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              </div>
            </div>
          </Spin>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default ModelListPage;

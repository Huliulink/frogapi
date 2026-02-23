import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Spin, Card, Collapsible } from '@douyinfe/semi-ui';
import { Search, Server, LayoutList, ChevronDown, ChevronUp } from 'lucide-react';
import { API, showError } from '../../../helpers';
import { StatusContext } from '../../../context/Status';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import EndpointSidebar from './EndpointSidebar';
import ModelListTable from './ModelListTable';

const ModelListPage = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceType, setPriceType] = useState('official');
  const [currency, setCurrency] = useState('USD');
  const [searchText, setSearchText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const exchangeRate = statusState?.status?.usd_exchange_rate || 7;

  const totalModels = useMemo(() => {
    let count = 0;
    endpoints.forEach((ep) => {
      count += ep.models?.length || 0;
    });
    return count;
  }, [endpoints]);

  const selectedEndpoint = useMemo(() => {
    if (!selectedEndpointId) return endpoints[0] || null;
    return endpoints.find((ep) => ep.id === selectedEndpointId) || null;
  }, [endpoints, selectedEndpointId]);

  const filteredEndpoints = useMemo(() => {
    if (!searchText) return endpoints;
    const lower = searchText.toLowerCase();
    return endpoints.filter(
      (ep) =>
        ep.name?.toLowerCase().includes(lower) ||
        ep.url?.toLowerCase().includes(lower) ||
        ep.models?.some((m) => m.model_name?.toLowerCase().includes(lower)),
    );
  }, [endpoints, searchText]);

  const filteredModels = useMemo(() => {
    if (!selectedEndpoint) return [];
    const models = selectedEndpoint.models || [];
    if (!searchText) return models;
    const lower = searchText.toLowerCase();
    return models.filter((m) => m.model_name?.toLowerCase().includes(lower));
  }, [selectedEndpoint, searchText]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/model-list/');
      if (res.data.success) {
        const data = res.data.data || [];
        setEndpoints(data);
        if (data.length > 0 && !selectedEndpointId) {
          setSelectedEndpointId(data[0].id);
        }
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

  const handleSelectEndpoint = (id) => {
    setSelectedEndpointId(id);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className='mt-[60px] px-4'>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-start justify-between'} mb-4`}>
        <div>
          <h2 className='text-2xl font-bold mb-1' style={{ color: 'var(--semi-color-text-0)' }}>
            {t('模型列表')}
          </h2>
          <div className='flex items-center gap-4' style={{ color: 'var(--semi-color-text-2)' }}>
            <span className='flex items-center gap-1 text-sm'>
              <Server size={14} />
              {endpoints.length} {t('个分组')}
            </span>
            <span className='flex items-center gap-1 text-sm'>
              <LayoutList size={14} />
              {totalModels} {t('个模型')}
            </span>
          </div>
        </div>
        <Input
          prefix={<Search size={14} />}
          placeholder={t('搜索分组 / 模型...')}
          value={searchText}
          onChange={setSearchText}
          showClear
          style={{ width: isMobile ? '100%' : 260 }}
        />
      </div>

      <Spin spinning={loading}>
        {isMobile ? (
          <div className='flex flex-col gap-3'>
            {/* Collapsible Sidebar */}
            <Card bodyStyle={{ padding: 0 }}>
              <div
                className='flex items-center justify-between px-4 py-3 cursor-pointer'
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className='flex items-center gap-2 min-w-0'>
                  <Server size={16} style={{ color: 'var(--semi-color-text-2)', flexShrink: 0 }} />
                  <span className='text-sm font-medium truncate' style={{ color: 'var(--semi-color-text-0)' }}>
                    {selectedEndpoint?.name || t('选择分组')}
                  </span>
                </div>
                {sidebarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <Collapsible isOpen={sidebarOpen}>
                <div style={{ borderTop: '1px solid var(--semi-color-border)' }}>
                  <EndpointSidebar
                    endpoints={filteredEndpoints}
                    selectedId={selectedEndpointId}
                    onSelect={handleSelectEndpoint}
                  />
                </div>
              </Collapsible>
            </Card>

            {/* Model Table */}
            <Card bodyStyle={{ padding: 0 }}>
              <ModelListTable
                endpoint={selectedEndpoint}
                models={filteredModels}
                priceType={priceType}
                onPriceTypeChange={setPriceType}
                currency={currency}
                onCurrencyChange={setCurrency}
                exchangeRate={exchangeRate}
                isMobile={isMobile}
              />
            </Card>
          </div>
        ) : (
          <div className='flex gap-4' style={{ minHeight: 500 }}>
            {/* Left: Endpoint Sidebar */}
            <Card
              className='flex-shrink-0'
              style={{ width: 300, overflow: 'hidden' }}
              bodyStyle={{ padding: 0 }}
            >
              <EndpointSidebar
                endpoints={filteredEndpoints}
                selectedId={selectedEndpointId}
                onSelect={setSelectedEndpointId}
              />
            </Card>

            {/* Right: Model Table */}
            <Card className='flex-1 min-w-0' bodyStyle={{ padding: 0 }}>
              <ModelListTable
                endpoint={selectedEndpoint}
                models={filteredModels}
                priceType={priceType}
                onPriceTypeChange={setPriceType}
                currency={currency}
                onCurrencyChange={setCurrency}
                exchangeRate={exchangeRate}
                isMobile={isMobile}
              />
            </Card>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default ModelListPage;

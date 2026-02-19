import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Divider } from '@douyinfe/semi-ui';
import { Layers } from 'lucide-react';

const EndpointSidebar = ({ endpoints, selectedId, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className='flex items-center gap-2 px-4 py-3' style={{ borderBottom: '1px solid var(--semi-color-border)' }}>
        <Layers size={16} style={{ color: 'var(--semi-color-text-2)' }} />
        <span className='text-sm font-semibold' style={{ color: 'var(--semi-color-text-0)' }}>
          {t('可用分组')}
        </span>
      </div>
      <div className='overflow-y-auto' style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {endpoints.map((ep, index) => (
          <div key={ep.id}>
            <div
              className='px-4 py-3 cursor-pointer transition-colors'
              style={{
                backgroundColor: selectedId === ep.id ? 'var(--semi-color-primary-light-default)' : 'transparent',
              }}
              onClick={() => onSelect(ep.id)}
            >
              <div className='flex items-center justify-between'>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-medium truncate' style={{ color: 'var(--semi-color-text-0)' }}>
                    {ep.name}
                  </div>
                  {ep.url && (
                    <div className='text-xs truncate mt-0.5' style={{ color: 'var(--semi-color-text-2)' }}>
                      {ep.url}
                    </div>
                  )}
                </div>
                <Tag size='small' color='violet' className='ml-2 flex-shrink-0'>
                  {t('计费倍率')}: {ep.ratio || 1}x
                </Tag>
              </div>
            </div>
            {index < endpoints.length - 1 && (
              <Divider margin={0} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EndpointSidebar;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Avatar } from '@douyinfe/semi-ui';
import { getLobeHubIcon } from '../../../helpers/render';

const EndpointSidebar = ({ endpoints, selectedId, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div className='flex flex-col gap-1 p-2'>
      <div
        className='px-3 py-2 rounded-lg cursor-pointer transition-colors'
        style={{
          backgroundColor: !selectedId ? 'var(--semi-color-primary-light-default)' : 'transparent',
        }}
        onClick={() => onSelect(null)}
      >
        <span className='text-sm font-medium'>{t('全部端点')}</span>
      </div>
      {endpoints.map((ep) => (
        <div
          key={ep.id}
          className='px-3 py-2 rounded-lg cursor-pointer transition-colors'
          style={{
            backgroundColor: selectedId === ep.id ? 'var(--semi-color-primary-light-default)' : 'transparent',
          }}
          onClick={() => onSelect(ep.id)}
        >
          <div className='flex items-center gap-2'>
            {ep.icon ? (
              getLobeHubIcon(ep.icon, 16)
            ) : (
              <Avatar size='extra-extra-small' style={{ flexShrink: 0 }}>
                {ep.name?.charAt(0) || '?'}
              </Avatar>
            )}
            <div className='flex flex-col min-w-0'>
              <span className='text-sm font-medium truncate'>{ep.name}</span>
              {ep.url && (
                <span className='text-xs truncate' style={{ color: 'var(--semi-color-text-2)' }}>
                  {ep.url}
                </span>
              )}
            </div>
          </div>
          {ep.ratio !== 1 && ep.ratio !== 0 && (
            <Tag size='small' color='blue' className='mt-1'>
              {ep.ratio}x
            </Tag>
          )}
        </div>
      ))}
    </div>
  );
};

export default EndpointSidebar;

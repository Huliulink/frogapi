import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Timeline, Empty, Avatar, Tag, Spin, Input, Button, Toast, Typography, Badge } from '@douyinfe/semi-ui';
import {
  Wallet,
  TrendingDown,
  Send,
  Hash,
  Coins,
  Type,
  Gauge,
  Zap,
  Bell,
  Mail,
  IdCard,
  UserCircle,
  Gift,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { marked } from 'marked';
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import { API, showError, renderQuota } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { UserContext } from '../../context/User';

const { Text } = Typography;

const StatCard = ({ icon: Icon, title, value, color }) => (
  <Card bodyStyle={{ padding: '16px' }}>
    <div className='flex items-center gap-3'>
      <div
        className='flex items-center justify-center w-10 h-10 rounded-lg'
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='text-xs truncate' style={{ color: 'var(--semi-color-text-2)' }}>
          {title}
        </div>
        <div className='text-lg font-semibold truncate' style={{ color: 'var(--semi-color-text-0)' }}>
          {value ?? '-'}
        </div>
      </div>
    </div>
  </Card>
);

const ConsoleHomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusState] = useContext(StatusContext);
  const [userState, userDispatch] = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({ times: 0, tokens: 0, quota: 0 });

  const user = userState?.user || {};

  const affLink = useMemo(() => {
    const code = user.aff_code || user.id || '';
    return code ? `${window.location.origin}/register?aff=${code}` : '';
  }, [user.aff_code, user.id]);

  const handleCopyAffLink = () => {
    if (!affLink) return;
    navigator.clipboard.writeText(affLink).then(() => {
      Toast.success(t('已复制'));
    });
  };

  const loadUserData = async () => {
    try {
      const res = await API.get('/api/user/self');
      if (res.data.success) {
        userDispatch({ type: 'login', payload: res.data.data });
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const loadStatsData = async () => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const dayAgo = now - 86400;
      const res = await API.get(
        `/api/data/self/?start_timestamp=${dayAgo}&end_timestamp=${now + 3600}&default_time=hour`,
      );
      if (res.data.success) {
        const data = res.data.data || [];
        let totalTokens = 0;
        let totalTimes = 0;
        let totalQuota = 0;
        data.forEach((item) => {
          totalTimes += item.count || 0;
          totalQuota += item.quota || 0;
          totalTokens += item.token_count || item.count || 0;
        });
        setStatsData({ times: totalTimes, tokens: totalTokens, quota: totalQuota });
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadUserData(), loadStatsData()]);
      setLoading(false);
    };
    init();
  }, []);

  const avgRPM = statsData.times > 0 ? (statsData.times / 1440).toFixed(3) : '0';
  const avgTPM = statsData.tokens > 0 ? (statsData.tokens / 1440).toFixed(3) : '0';

  const announcements = useMemo(() => {
    try {
      const raw = statusState?.status?.announcements;
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, 10);
    } catch {
      return [];
    }
  }, [statusState?.status?.announcements]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return t('早上好');
    if (h >= 12 && h < 14) return t('中午好');
    if (h >= 14 && h < 18) return t('下午好');
    return t('晚上好');
  }, [t]);

  const stats = [
    { icon: Wallet, title: t('当前余额'), value: renderQuota(user.quota), color: '#3b82f6' },
    { icon: TrendingDown, title: t('历史消耗'), value: renderQuota(user.used_quota), color: '#8b5cf6' },
    { icon: Send, title: t('请求次数'), value: user.request_count?.toLocaleString(), color: '#10b981' },
    { icon: Hash, title: t('统计次数'), value: statsData.times.toLocaleString(), color: '#06b6d4' },
    { icon: Coins, title: t('统计额度'), value: renderQuota(statsData.quota), color: '#f59e0b' },
    { icon: Type, title: t('统计Tokens'), value: statsData.tokens.toLocaleString(), color: '#ec4899' },
    { icon: Gauge, title: t('平均RPM'), value: avgRPM, color: '#6366f1' },
    { icon: Zap, title: t('平均TPM'), value: avgTPM, color: '#f97316' },
  ];

  return (
    <div className='mt-[60px] px-4'>
      <Spin spinning={loading}>
        {/* 问候 + 账户信息 */}
        <Card bodyStyle={{ padding: '20px 24px' }}>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <Avatar size='large' style={{ backgroundColor: '#c6613f' }}>
                {(user.username || '?')[0].toUpperCase()}
              </Avatar>
              <div>
                <div className='text-xl font-semibold' style={{ color: 'var(--semi-color-text-0)' }}>
                  👋{greeting}，{user.username || '-'}
                </div>
                <div className='flex flex-wrap items-center gap-3 mt-1 text-sm' style={{ color: 'var(--semi-color-text-2)' }}>
                  <span className='flex items-center gap-1'>
                    <IdCard size={14} />
                    ID: {user.id || '-'}
                  </span>
                  <span className='flex items-center gap-1'>
                    <UserCircle size={14} />
                    {user.username || '-'}
                  </span>
                  {user.email && (
                    <span className='flex items-center gap-1'>
                      <Mail size={14} />
                      {user.email}
                    </span>
                  )}
                  {user.group && (
                    <Tag size='small' color='blue'>{user.group}</Tag>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 统计卡片 - 紧贴账户信息 */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 mb-4'>
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        {/* 系统公告 */}
        <Card
          className='mb-4'
          title={
            <div className='flex items-center gap-2'>
              <Bell size={16} />
              {t('系统公告')}
            </div>
          }
          bodyStyle={{ padding: announcements.length > 0 ? '16px' : 0 }}
        >
          {announcements.length > 0 ? (
            <Timeline mode='left'>
              {announcements.map((item, idx) => (
                <Timeline.Item
                  key={item.id || idx}
                  type={item.type || 'default'}
                  time={item.publishDate || ''}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(item.content || ''),
                    }}
                  />
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <div className='flex justify-center items-center py-8'>
              <Empty
                image={<IllustrationConstruction style={{ width: 150, height: 150 }} />}
                darkModeImage={<IllustrationConstructionDark style={{ width: 150, height: 150 }} />}
                title={t('暂无系统公告')}
              />
            </div>
          )}
        </Card>

        {/* 邀请奖励 */}
        <Card
          title={
            <div className='flex items-center gap-2'>
              <Gift size={16} />
              {t('邀请奖励')}
              <Text type='tertiary' size='small'>{t('邀请好友获得额外奖励')}</Text>
            </div>
          }
        >
          <div className='flex flex-col gap-4'>
            {/* 邀请链接 */}
            <div>
              <div className='text-sm mb-2' style={{ color: 'var(--semi-color-text-2)' }}>
                {t('邀请链接')}
              </div>
              <Input
                value={affLink}
                readonly
                className='!rounded-lg'
                suffix={
                  <Button
                    theme='solid'
                    size='small'
                    icon={<Copy size={14} />}
                    onClick={handleCopyAffLink}
                    className='!rounded-lg'
                  >
                    {t('复制')}
                  </Button>
                }
              />
            </div>

            {/* 奖励说明 */}
            <div className='space-y-2'>
              <div className='flex items-start gap-2'>
                <Badge dot type='success' />
                <Text type='tertiary' size='small'>
                  {t('邀请好友注册，好友充值后您可获得相应奖励')}
                </Text>
              </div>
              <div className='flex items-start gap-2'>
                <Badge dot type='success' />
                <Text type='tertiary' size='small'>
                  {t('通过划转功能将奖励额度转入到您的账户余额中')}
                </Text>
              </div>
            </div>

            {/* 前往钱包管理 */}
            <Button
              theme='light'
              icon={<ArrowRight size={14} />}
              iconPosition='right'
              onClick={() => navigate('/console/topup')}
              className='!rounded-lg self-start'
            >
              {t('前往钱包管理')}
            </Button>
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default ConsoleHomePage;

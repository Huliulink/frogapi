import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Check, DollarSign, BarChart3, Sparkles, Layers, Zap, Sun, Moon } from 'lucide-react';
import { API, showError } from '../../helpers';
import { marked } from 'marked';
import NoticeModal from '../../components/layout/NoticeModal';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { useActualTheme, useSetTheme } from '../../context/Theme';

const features = [
  {
    icon: Check,
    title: '稳定优先',
    description: '独家网关，确保号池稳定，可用率达 99.5%',
  },
  {
    icon: DollarSign,
    title: '高性价比',
    description: '可选按量/包月计费，使用成本仅官网十分之一',
  },
  {
    icon: BarChart3,
    title: '透明计费',
    description: '实时监控用量，无任何隐藏扣费',
  },
  {
    icon: Sparkles,
    title: '简单易用',
    description: '一键创建 API Key，快速接入各大模型服务',
  },
  {
    icon: Layers,
    title: '多种渠道',
    description: 'Codex 号池、Claude Max 号池、Droid 号池多渠道聚合',
  },
  {
    icon: Zap,
    title: '专业客服',
    description: '专业客服团队，极速响应，解决您的任何疑问',
  },
];

const Home = () => {
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const actualTheme = useActualTheme();
  const setTheme = useSetTheme();

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };
    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <div className='w-full h-screen overflow-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='relative h-screen overflow-hidden'>
          {/* Background Image */}
          <div className='absolute inset-0 home-bg-image' />

          {/* Theme Toggle - Top Right */}
          <button
            type='button'
            onClick={toggleTheme}
            className='absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200'
            style={{
              backgroundColor: 'var(--semi-color-fill-0)',
              color: 'var(--semi-color-text-0)',
            }}
          >
            {actualTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Main Content */}
          <section className='relative z-10 w-full h-full'>
            <div className='flex h-full items-center'>
              <div className='container mx-auto px-4 py-16'>
                <div className='text-center max-w-4xl mx-auto'>
                  {/* Logo */}
                  <div className='text-5xl md:text-6xl lg:text-7xl pb-1 opacity-0 home-animate-fade-in-up'>
                    <h1
                      aria-label='Frog API'
                      className='relative inline-block font-frog-api font-extrabold tracking-wide leading-[1.12] select-none'
                    >
                      <span
                        style={{
                          color: '#c6613f',
                        }}
                      >
                        Frog API
                      </span>
                    </h1>
                  </div>

                  {/* Subtitle */}
                  <p
                    className='text-xl md:text-2xl mb-12 opacity-0 home-animate-fade-in-up home-delay-100'
                    style={{ color: 'var(--semi-color-text-2)' }}
                  >
                    企业级 AI Agent 分发平台
                  </p>

                  {/* CTA Button */}
                  <div className='flex gap-4 justify-center mb-16 opacity-0 home-animate-fade-in-up home-delay-200'>
                    <Link to='/login'>
                      <button
                        type='button'
                        className='inline-flex items-center justify-center min-w-24 h-12 px-8 text-medium gap-3 rounded-xl font-medium transition-all duration-200 hover:opacity-90 hover:scale-[0.98] active:scale-[0.97]'
                        style={{
                          backgroundColor: '#c6613f',
                          color: '#fff',
                          boxShadow: '0 10px 15px -3px rgba(198, 97, 63, 0.25)',
                        }}
                      >
                        立即开始
                      </button>
                    </Link>
                  </div>

                  {/* Feature Cards */}
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16'>
                    {features.map((feature, index) => (
                      <div
                        key={feature.title}
                        className='home-card group relative flex flex-col overflow-hidden rounded-2xl p-6 opacity-0 home-animate-fade-in-up'
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <div className='flex items-center gap-3 mb-3'>
                          <div className='flex items-center justify-center w-8 h-8 rounded-lg home-icon-box'>
                            <feature.icon className='w-4 h-4 home-icon-color' />
                          </div>
                          <h3
                            className='text-lg font-bold'
                            style={{ color: 'var(--semi-color-text-0)' }}
                          >
                            {feature.title}
                          </h3>
                        </div>
                        <p
                          className='text-left text-sm leading-relaxed'
                          style={{ color: 'var(--semi-color-text-2)' }}
                        >
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;

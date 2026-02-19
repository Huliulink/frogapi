import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useActualTheme, useSetTheme } from '../../context/Theme';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const AuthLayout = ({ children }) => {
  const actualTheme = useActualTheme();
  const setTheme = useSetTheme();
  const isMobile = useIsMobile();

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className='h-screen overflow-hidden flex relative'>
      {/* Background Image */}
      <div className='absolute inset-0 home-bg-image' />

      {/* Theme Toggle */}
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

      {/* Left Side - Artistic Text */}
      {!isMobile && (
        <div className='w-1/2 flex items-center justify-center relative z-10'>
          <h1
            aria-label='Frog API'
            className='relative inline-block font-frog-api font-extrabold tracking-wide select-none text-6xl lg:text-7xl'
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
      )}

      {/* Right Side - Frosted Glass */}
      <div
        className={`${isMobile ? 'w-full' : 'w-1/2'} relative z-10 flex items-center justify-center auth-glass-panel`}
      >
        <div className='w-full max-w-md px-6 overflow-y-auto max-h-full py-8 scrollbar-hide'>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

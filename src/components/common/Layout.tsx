import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const layoutStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: 'var(--bg-primary)',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={layoutStyle}>
      <main style={contentStyle}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default Layout;

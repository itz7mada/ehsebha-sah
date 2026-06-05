import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ClockIcon, SettingsIcon } from './Icons';

interface NavItem {
  label: string;
  path: string;
  icon: (props: { size: number; color: string }) => React.ReactElement;
}

// dir="ltr" on container → DOM order = visual order (left → center → right)
// Visual: [ الإعدادات ]  [ الرئيسية ]  [ رحلتي ]
const NAV_ITEMS: NavItem[] = [
  { label: 'الإعدادات', path: '/settings', icon: SettingsIcon },
  { label: 'الرئيسية',  path: '/dashboard', icon: HomeIcon },
  { label: 'رحلتي',     path: '/journey',   icon: ClockIcon },
];

export function BottomNav() {
  const { pathname } = useLocation();

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    insetInlineStart: 0,
    insetInlineEnd: 0,
    height: 'calc(var(--nav-height) + var(--safe-bottom))',
    background: 'var(--bg-card)',
    borderTop: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: 'var(--space-1)',
    paddingBottom: 'var(--safe-bottom)',
    zIndex: 50,
    boxShadow: '0 -4px 16px rgba(0,0,0,0.05)',
    transition: 'transform var(--transition-fast)',
  };

  const itemsStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    alignItems: 'flex-start',
  };

  return (
    <nav style={navStyle} className="bottom-nav" aria-label="التنقل الرئيسي" dir="ltr">
      <div style={itemsStyle}>
        {NAV_ITEMS.map((item, index) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const isCenter = index === 1;

          if (isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  padding: '0',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '7px 22px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  boxShadow: isActive ? '0 2px 8px rgba(196,146,42,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all var(--transition-fast)',
                  marginTop: '-4px',
                }}>
                  <item.icon size={28} color={isActive ? 'var(--accent)' : 'var(--text-secondary)'} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'color var(--transition-fast)',
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                  }}>
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                gap: '3px',
                padding: 'var(--space-1) 0 0',
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon size={22} color={isActive ? 'var(--accent)' : 'var(--text-secondary)'} />
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'color var(--transition-fast)',
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;

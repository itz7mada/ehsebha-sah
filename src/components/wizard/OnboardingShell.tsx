import React from 'react';
import { ChevronRightIcon } from '../common/Icons';

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  animating: boolean;
  children: React.ReactNode;
}

export function OnboardingShell({ step, totalSteps, onBack, animating, children }: OnboardingShellProps) {
  return (
    <div style={rootStyle}>
      <div style={navStyle}>
        {step > 1 ? (
          <button type="button" style={backBtnStyle} onClick={onBack} aria-label="رجوع">
            <ChevronRightIcon size={18} color="var(--text-secondary)" />
          </button>
        ) : (
          <div style={spacerStyle} />
        )}

        <div style={segRowStyle}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={i < step ? segActiveStyle : segInactiveStyle} />
          ))}
        </div>

        <span style={countStyle}>{step} / {totalSteps}</span>
      </div>

      <div
        style={{
          ...contentWrapStyle,
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(6px)' : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-primary)',
  direction: 'rtl',
};

const navStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'calc(env(safe-area-inset-top, 0px) + 14px) var(--space-5) 12px',
  direction: 'rtl',
};

const backBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
  outline: 'none',
};

const spacerStyle: React.CSSProperties = {
  width: '36px',
  flexShrink: 0,
};

const segRowStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  gap: '3px',
};

const segBase: React.CSSProperties = {
  flex: 1,
  height: '3px',
  borderRadius: '99px',
  transition: 'background 300ms ease',
};

const segActiveStyle: React.CSSProperties = { ...segBase, background: 'var(--accent)' };
const segInactiveStyle: React.CSSProperties = { ...segBase, background: 'var(--border)' };

const countStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
  flexShrink: 0,
  fontFamily: 'var(--font-family)',
  letterSpacing: '0.5px',
  direction: 'ltr',
};

const contentWrapStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  transition: 'opacity 180ms ease, transform 180ms ease',
};

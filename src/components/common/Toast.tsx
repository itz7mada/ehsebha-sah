import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ToastContextValue {
  /** Show a brief confirmation toast (e.g. "تم الحفظ ✓"). Auto-dismisses. */
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Lightweight in-app toast. A small RTL pill above the bottom nav that fades in
 * then auto-dismisses. No dependencies, no network — purely local UI feedback.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const clearTimer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string) => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(clearTimer.current);
    setMessage(msg);
    // Next frame so the enter transition runs even on a repeat toast.
    requestAnimationFrame(() => setVisible(true));
    hideTimer.current = window.setTimeout(() => setVisible(false), 2000);
    clearTimer.current = window.setTimeout(() => setMessage(null), 2280);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(clearTimer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            ...wrapStyle,
            opacity: visible ? 1 : 0,
            transform: `translateX(-50%) translateY(${visible ? '0' : '8px'})`,
          }}
        >
          <span style={pillStyle}>
            <CheckGlyph />
            {message}
          </span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function CheckGlyph() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M1.5 6.5L5.5 10.5L14.5 1.5" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const wrapStyle: React.CSSProperties = {
  position: 'fixed',
  insetInlineStart: '50%',
  bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 18px)',
  zIndex: 1000,
  pointerEvents: 'none',
  transition: 'opacity 220ms ease, transform 220ms ease',
  maxWidth: 'calc(100% - var(--space-8))',
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'var(--text-primary)',
  color: 'var(--bg-card)',
  padding: '11px 20px',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  fontFamily: 'var(--font-family)',
  boxShadow: 'var(--shadow-lg)',
  whiteSpace: 'nowrap',
};

export default ToastProvider;

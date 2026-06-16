import React from 'react';
import { XIcon } from './Icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  snapHeight?: 'auto' | 'half' | 'full';
}


export function BottomSheet({ isOpen, onClose, title, children, footer, snapHeight = 'auto' }: BottomSheetProps) {
  // Height of the on-screen keyboard (iOS): lifts the sheet so inputs/footer stay visible.
  const [kbInset, setKbInset] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-sheet-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-sheet-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-sheet-open');
    };
  }, [isOpen]);

  // Keyboard-safe: track the visual viewport so the sheet rises above the keyboard
  // instead of hiding behind it (the classic iOS fixed-position jump).
  React.useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset > 80 ? inset : 0); // ignore tiny URL-bar deltas
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setKbInset(0);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Non-full sheets cap at ~92dvh so the page peeks behind (native feel); full uses the screen.
  const capVh = snapHeight === 'full' ? '100dvh' : '92dvh';

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'var(--bg-overlay)',
    animation: 'fadeIn 200ms both',
  };

  const sheetStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: kbInset,
    insetInlineStart: 0,
    insetInlineEnd: 0,
    zIndex: 101,
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
    boxShadow: 'var(--shadow-xl)',
    animation: 'slideUp 300ms cubic-bezier(0.32,0.72,0,1) both',
    maxHeight: `calc(${capVh} - env(safe-area-inset-top, 0px) - 12px - ${kbInset}px)`,
    height: snapHeight === 'full' ? `calc(100dvh - env(safe-area-inset-top, 0px) - 12px - ${kbInset}px)` : undefined,
    transition: 'bottom 220ms ease, max-height 220ms ease',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const dragBarStyle: React.CSSProperties = {
    width: '36px',
    height: '4px',
    background: 'var(--border)',
    borderRadius: 'var(--radius-full)',
    margin: '12px auto 8px',
    flexShrink: 0,
    opacity: 0.6,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-2) var(--space-5) var(--space-3)',
    borderBottom: title ? '1px solid var(--border-light)' : 'none',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 800,
    color: 'var(--text-primary)',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid var(--border-light)',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    transition: 'background var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
  };

  const bodyStyle: React.CSSProperties = {
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch' as const,
    flex: 1,
    padding: 'var(--space-3) var(--space-5)',
    paddingBottom: footer ? 'var(--space-3)' : 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
  };

  const footerStyle: React.CSSProperties = {
    flexShrink: 0,
    padding: 'var(--space-3) var(--space-5)',
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
    borderTop: '1px solid var(--border-light)',
    background: 'var(--bg-card)',
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} aria-hidden="true" />
      <div style={sheetStyle} role="dialog" aria-modal="true" aria-label={title}>
        <div style={dragBarStyle} />
        {title ? (
          <div style={headerStyle}>
            <span style={titleStyle}>{title}</span>
            <button style={closeBtnStyle} onClick={onClose} aria-label="إغلاق">
              <XIcon size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 var(--space-5) var(--space-2)', flexShrink: 0 }}>
            <button style={closeBtnStyle} onClick={onClose} aria-label="إغلاق">
              <XIcon size={18} />
            </button>
          </div>
        )}
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </>
  );
}

export default BottomSheet;

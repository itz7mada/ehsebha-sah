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

const snapHeightMap: Record<string, string> = {
  auto: 'auto',
  half: '50dvh',
  full: '90dvh',
};

export function BottomSheet({ isOpen, onClose, title, children, footer, snapHeight = 'auto' }: BottomSheetProps) {
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

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'var(--bg-overlay)',
    animation: 'fadeIn 200ms both',
  };

  const sheetMaxHeight = snapHeightMap[snapHeight] ?? 'auto';
  const sheetStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    insetInlineStart: 0,
    insetInlineEnd: 0,
    zIndex: 101,
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
    boxShadow: 'var(--shadow-xl)',
    animation: 'slideUp 300ms cubic-bezier(0.32,0.72,0,1) both',
    maxHeight: snapHeight === 'auto' ? '90dvh' : sheetMaxHeight,
    height: snapHeight === 'full' ? '90dvh' : undefined,
    display: 'flex',
    flexDirection: 'column',
  };

  const dragBarStyle: React.CSSProperties = {
    width: '40px',
    height: '4px',
    background: 'var(--border)',
    borderRadius: 'var(--radius-full)',
    margin: 'var(--space-3) auto var(--space-2)',
    flexShrink: 0,
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
    fontSize: 'var(--font-size-md)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    transition: 'background var(--transition-fast)',
  };

  const bodyStyle: React.CSSProperties = {
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch' as const,
    flex: 1,
    padding: 'var(--space-3) var(--space-5)',
    paddingBottom: footer ? 'var(--space-2)' : `calc(var(--safe-bottom) + var(--space-6))`,
  };

  const footerStyle: React.CSSProperties = {
    flexShrink: 0,
    padding: 'var(--space-3) var(--space-5)',
    paddingBottom: `calc(var(--safe-bottom) + var(--space-4))`,
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

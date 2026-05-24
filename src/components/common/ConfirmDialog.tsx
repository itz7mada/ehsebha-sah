import React from 'react';
import { Button } from './Button';
import { TrashIcon, AlertIcon } from './Icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'default',
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    background: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-5)',
    animation: 'fadeIn 180ms both',
  };

  const dialogStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-2xl)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-xl)',
    padding: 'var(--space-6)',
    width: '100%',
    maxWidth: '360px',
    animation: 'scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1) both',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  const iconWrapStyle: React.CSSProperties = {
    width: '52px',
    height: '52px',
    borderRadius: 'var(--radius-full)',
    background: variant === 'danger' ? 'var(--danger-light)' : 'var(--accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-md)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
  };

  const messageStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: '1.7',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-3)',
    marginTop: 'var(--space-1)',
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <div style={iconWrapStyle}>
          {variant === 'danger'
            ? <TrashIcon size={22} color="var(--danger)" />
            : <AlertIcon size={22} color="var(--accent)" />
          }
        </div>
        <div>
          <p id="confirm-title" style={titleStyle}>{title}</p>
        </div>
        <p id="confirm-message" style={messageStyle}>{message}</p>
        <div style={actionsStyle}>
          <Button variant="secondary" fullWidth onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} fullWidth onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit';
  icon?: React.ReactNode;
}

const sizeMap: Record<ButtonSize, { height: string; fontSize: string; padding: string; iconSize: number }> = {
  sm: { height: '32px', fontSize: 'var(--font-size-sm)', padding: '0 var(--space-3)', iconSize: 14 },
  md: { height: '44px', fontSize: 'var(--font-size-base)', padding: '0 var(--space-5)', iconSize: 18 },
  lg: { height: '52px', fontSize: 'var(--font-size-md)', padding: '0 var(--space-6)', iconSize: 20 },
  xl: { height: '60px', fontSize: 'var(--font-size-lg)', padding: '0 var(--space-8)', iconSize: 22 },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--accent)',
    color: 'var(--text-inverse)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--accent)',
    border: '1.5px solid var(--accent)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    border: 'none',
  },
  danger: {
    backgroundColor: 'var(--danger)',
    color: 'var(--text-inverse)',
    border: 'none',
  },
};

const spinnerStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  border: '2px solid rgba(255,255,255,0.35)',
  borderTopColor: 'currentColor',
  borderRadius: 'var(--radius-full)',
  animation: 'spin 0.7s linear infinite',
  display: 'inline-block',
  flexShrink: 0,
};

const spinnerSecondaryStyle: React.CSSProperties = {
  ...spinnerStyle,
  border: '2px solid var(--accent-light)',
  borderTopColor: 'var(--accent)',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  icon,
}: ButtonProps) {
  const [pressed, setPressed] = React.useState(false);
  const sz = sizeMap[size];
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    height: sz.height,
    fontSize: sz.fontSize,
    padding: sz.padding,
    fontFamily: 'var(--font-family)',
    fontWeight: 600,
    borderRadius: 'var(--radius-full)',
    width: fullWidth ? '100%' : undefined,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.55 : 1,
    transition: 'all var(--transition-fast)',
    transform: pressed && !isDisabled ? 'scale(0.98)' : 'scale(1)',
    boxShadow: pressed && !isDisabled ? 'none' : (variant === 'primary' ? 'var(--shadow-sm)' : 'none'),
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
    ...variantStyles[variant],
  };

  const spinStyle = (variant === 'secondary' || variant === 'ghost') ? spinnerSecondaryStyle : spinnerStyle;

  return (
    <button
      type={type}
      style={baseStyle}
      onClick={isDisabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={isDisabled}
      aria-busy={loading}
    >
      {loading ? (
        <span style={spinStyle} />
      ) : (
        <>
          {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

export default Button;

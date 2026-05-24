import React from 'react';

type CardPadding = 'sm' | 'md' | 'lg' | 'none';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: CardPadding;
  style?: React.CSSProperties;
}

const paddingMap: Record<CardPadding, string> = {
  none: '0',
  sm: 'var(--space-3)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
};

export function Card({ children, className, onClick, padding = 'md', style }: CardProps) {
  const [hovered, setHovered] = React.useState(false);

  const isClickable = typeof onClick === 'function';

  const cardStyle: React.CSSProperties = {
    padding: paddingMap[padding],
    cursor: isClickable ? 'pointer' : undefined,
    boxShadow: isClickable && hovered ? 'var(--shadow-md)' : undefined,
    transform: isClickable && hovered ? 'translateY(-1px)' : undefined,
    transition: 'box-shadow var(--transition-fast), transform var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
    ...style,
  };

  return (
    <div
      className={`card${className ? ` ${className}` : ''}`}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={isClickable ? () => setHovered(true) : undefined}
      onMouseLeave={isClickable ? () => setHovered(false) : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
    >
      {children}
    </div>
  );
}

export default Card;

import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  value,
  color = 'var(--accent)',
  height = 8,
  showLabel = false,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const trackStyle: React.CSSProperties = {
    width: '100%',
    height: `${height}px`,
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    position: 'relative',
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${clamped}%`,
    background: color,
    borderRadius: 'var(--radius-full)',
    transition: animated ? 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    minWidth: clamped > 0 ? `${height}px` : '0',
  };

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    minWidth: '36px',
    textAlign: 'start',
    direction: 'ltr',
    flexShrink: 0,
  };

  return (
    <div style={wrapperStyle}>
      <div style={trackStyle}>
        <div style={fillStyle} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} />
      </div>
      {showLabel && <span style={labelStyle}>{Math.round(clamped)}%</span>}
    </div>
  );
}

export default ProgressBar;

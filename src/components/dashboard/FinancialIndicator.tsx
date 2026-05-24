interface FinancialIndicatorProps {
  level: 'comfortable' | 'balanced' | 'attention';
  percentage: number;
}

const CONFIG = {
  comfortable: {
    dot: 'var(--success)',
    label: 'مريح',
    subtext: 'الميزانية بخير',
    bg: 'var(--success-light)',
    color: 'var(--success)',
  },
  balanced: {
    dot: 'var(--warning)',
    label: 'متوازن',
    subtext: 'الميزانية تسير بشكل جيد',
    bg: 'var(--warning-light)',
    color: 'var(--warning)',
  },
  attention: {
    dot: 'var(--danger)',
    label: 'يحتاج انتباه',
    subtext: 'راجع المصروفات',
    bg: 'var(--danger-light)',
    color: 'var(--danger)',
  },
};

export function FinancialIndicator({ level }: FinancialIndicatorProps) {
  const cfg = CONFIG[level];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        background: cfg.bg,
        color: cfg.color,
        fontSize: 'var(--font-size-sm)',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
      title={cfg.subtext}
      aria-label={`حالة الميزانية: ${cfg.label}`}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
          display: 'inline-block',
        }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}

export default FinancialIndicator;

import React from 'react';
import type { BudgetStats } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { EyeIcon, EyeOffIcon } from '../common/Icons';

interface BudgetHeroProps {
  stats: BudgetStats;
  hideAmounts: boolean;
  onToggleHide: () => void;
}

const STATUS_CONFIG = {
  comfortable: { label: 'مريح',            color: 'var(--success)', bg: 'var(--success-light)' },
  balanced:    { label: 'متوازن',           color: 'var(--accent)',  bg: 'var(--accent-light)'  },
  attention:   { label: 'قريب من الحد',     color: 'var(--warning)', bg: 'var(--warning-light)' },
  exceeded:    { label: 'تجاوز الميزانية',  color: 'var(--danger)',  bg: 'var(--danger-light)'  },
};

export function BudgetHero({ stats, hideAmounts, onToggleHide }: BudgetHeroProps) {
  const isOverBudget = stats.remaining < 0;
  const pct = Math.min(Math.max(stats.spentPercentage, 0), 100);
  const status = STATUS_CONFIG[stats.comfortLevel];
  const progressColor = stats.comfortLevel === 'exceeded' ? 'var(--danger)'
    : stats.comfortLevel === 'attention' ? 'var(--warning)'
    : 'var(--accent)';

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={cardLabelStyle}>نظرة الميزانية</span>
        <button
          type="button"
          onClick={onToggleHide}
          style={eyeBtnStyle}
          aria-label={hideAmounts ? 'إظهار المبالغ' : 'إخفاء المبالغ'}
        >
          {hideAmounts
            ? <EyeOffIcon size={18} color="var(--text-tertiary)" />
            : <EyeIcon size={18} color="var(--text-tertiary)" />
          }
        </button>
      </div>

      {/* Amount + status pill */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            className="num"
            style={{
              ...mainAmountStyle,
              color: isOverBudget ? 'var(--danger)' : 'var(--text-primary)',
            }}
          >
            {hideAmounts ? '••••' : formatCurrency(Math.abs(stats.remaining))}
          </span>
          <span style={amountLabelStyle}>
            {isOverBudget ? 'تجاوز الميزانية' : 'المتبقي'}
          </span>
        </div>
        <span style={{ ...pillStyle, color: status.color, background: status.bg }}>
          {status.label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={progressTrackStyle}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: progressColor,
              borderRadius: 'inherit',
              transition: 'width 1s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={progressLabelStyle}>
            صُرف <span className="num">{Math.round(stats.spentPercentage)}%</span>
          </span>
          <span className="num" style={progressLabelStyle}>
            {hideAmounts ? '••••' : formatCurrency(stats.availableBudget)}
          </span>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-5)',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--border-light)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  width: '100%',
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
  letterSpacing: '0.02em',
};

const eyeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-tertiary)',
  WebkitTapHighlightColor: 'transparent',
};

const mainAmountStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 800,
  lineHeight: 1,
  direction: 'ltr',
  display: 'block',
};

const amountLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

const pillStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  borderRadius: 'var(--radius-full)',
  padding: '4px 10px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const progressTrackStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  background: 'var(--border)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
};

const progressLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

export default BudgetHero;

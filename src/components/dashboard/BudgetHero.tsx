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
      {/* Premium gold top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        height: '3px',
        background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))',
        borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
      }} />

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <span
            className="num"
            style={{
              ...mainAmountStyle,
              color: isOverBudget ? 'var(--danger)' : 'var(--text-primary)',
            }}
          >
            {hideAmounts ? '••••' : formatCurrency(Math.abs(stats.remaining))}
          </span>
          <p style={amountLabelStyle}>
            {isOverBudget ? 'تجاوز الميزانية' : 'المتبقي من الميزانية'}
          </p>
        </div>
        <span style={{
          ...pillStyle,
          color: status.color,
          background: status.bg,
          borderColor: status.color + '33',
          marginTop: '4px',
        }}>
          {status.label}
        </span>
      </div>

      {/* Progress bar — fills from reading-start (physical right in RTL) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={progressTrackStyle}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              insetInlineStart: 0,
              width: `${pct}%`,
              background: `linear-gradient(to inline-end, ${progressColor}99, ${progressColor})`,
              borderRadius: 'inherit',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={progressLabelStyle}>
            صُرف <span className="num" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
              {Math.round(stats.spentPercentage)}%
            </span>
          </span>
          <span style={progressLabelStyle}>
            الإجمالي{' '}
            <span className="num" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
              {hideAmounts ? '••••' : formatCurrency(stats.totalBudget)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-2xl)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-md)',
  border: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
  letterSpacing: '0.01em',
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
  fontSize: 'var(--font-size-4xl)',
  fontWeight: 800,
  lineHeight: 1,
  direction: 'ltr',
  display: 'block',
  letterSpacing: '-0.02em',
};

const amountLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

const pillStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  borderRadius: 'var(--radius-full)',
  padding: '5px 12px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  border: '1px solid transparent',
};

const progressTrackStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  background: 'var(--border)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
  position: 'relative',
};

const progressLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

export default BudgetHero;

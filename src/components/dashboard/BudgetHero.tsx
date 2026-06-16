import React from 'react';
import type { BudgetStats } from '../../types';
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
  const fillBg = progressColor === 'var(--accent)'
    ? 'linear-gradient(90deg, var(--accent-dark), var(--accent))'
    : progressColor;

  const remainingDigits = Math.abs(stats.remaining).toLocaleString('en-US');
  const totalDigits = stats.totalBudget.toLocaleString('en-US');
  const amountColor = isOverBudget ? 'var(--danger)' : 'var(--text-primary)';

  return (
    <div style={cardStyle}>
      {/* Warm ambient glow for depth */}
      <div style={glowStyle} aria-hidden="true" />
      {/* Premium gold top accent */}
      <div style={topBarStyle} aria-hidden="true" />

      <div style={contentStyle}>
        {/* Row 1: overview label + privacy eye */}
        <div style={headerRowStyle}>
          <span style={overviewLabelStyle}>نظرة الميزانية</span>
          <button
            type="button"
            onClick={onToggleHide}
            style={eyeBtnStyle}
            aria-label={hideAmounts ? 'إظهار المبالغ' : 'إخفاء المبالغ'}
          >
            {hideAmounts
              ? <EyeOffIcon size={18} color="var(--text-tertiary)" />
              : <EyeIcon size={18} color="var(--text-tertiary)" />}
          </button>
        </div>

        {/* Amount block — label above the number, pill on the same row */}
        <div style={amountSectionStyle}>
          <div style={amountTopRowStyle}>
            <span style={amountLabelStyle}>
              {isOverBudget ? 'تجاوز الميزانية' : 'المتبقي من الميزانية'}
            </span>
            <span style={{ ...pillStyle, color: status.color, background: status.bg, borderColor: status.color + '40' }}>
              <span style={{ ...pillDotStyle, background: status.color }} aria-hidden="true" />
              {status.label}
            </span>
          </div>

          {hideAmounts ? (
            <span className="num" style={{ ...bigNumberStyle, color: amountColor }}>••••</span>
          ) : (
            <div style={amountRowStyle}>
              <span className="num" style={{ ...bigNumberStyle, color: amountColor }}>{remainingDigits}</span>
              <span style={currencyUnitStyle}>د.إ</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={dividerStyle} aria-hidden="true" />

        {/* Progress — glossy gold fill that grows from the right (RTL) */}
        <div style={progressSectionStyle}>
          <div style={progressTrackStyle}>
            <div style={{ ...progressFillStyle, width: `${pct}%`, background: fillBg }}>
              {pct > 3 && pct < 99 && <span style={{ ...glowTipStyle, background: progressColor }} aria-hidden="true" />}
            </div>
          </div>
          <div style={progressMetaRowStyle}>
            <span style={progressMetaStyle}>
              صُرف <span className="num" style={progressMetaStrong}>{Math.round(stats.spentPercentage)}%</span>
            </span>
            <span style={progressMetaStyle}>
              الإجمالي <span className="num" style={progressMetaStrong}>{hideAmounts ? '••••' : `${totalDigits} د.إ`}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  position: 'relative',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-2xl)',
  boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.06)',
  border: '1px solid var(--border)',
  width: '100%',
  overflow: 'hidden',
};

const glowStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(130% 90% at 90% -10%, rgba(201,147,104,0.16), transparent 55%)',
  pointerEvents: 'none',
};

const topBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  insetInlineStart: 0,
  insetInlineEnd: 0,
  height: '3px',
  background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))',
};

const contentStyle: React.CSSProperties = {
  position: 'relative',
  padding: 'var(--space-6)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '2px',
};

const overviewLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  letterSpacing: '0.02em',
};

const eyeBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  marginInlineEnd: '-8px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  borderRadius: 'var(--radius-full)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-tertiary)',
  WebkitTapHighlightColor: 'transparent',
};

const amountSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const amountTopRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
};

const amountLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 700,
  borderRadius: 'var(--radius-full)',
  padding: '5px 12px 5px 10px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  border: '1px solid transparent',
};

const pillDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  flexShrink: 0,
};

const amountRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  direction: 'rtl',
};

const bigNumberStyle: React.CSSProperties = {
  fontSize: '44px',
  fontWeight: 800,
  lineHeight: 1.02,
  letterSpacing: '-0.02em',
  display: 'inline-block',
};

const currencyUnitStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'var(--border-light)',
  margin: '0 -2px',
};

const progressSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const progressTrackStyle: React.CSSProperties = {
  width: '100%',
  height: '10px',
  background: 'var(--track)',
  borderRadius: 'var(--radius-full)',
  overflow: 'visible',
  position: 'relative',
};

const progressFillStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  insetInlineStart: 0,
  borderRadius: 'var(--radius-full)',
  minWidth: '10px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 6px rgba(201,147,104,0.45)',
  transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
};

const glowTipStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  insetInlineEnd: '0',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  marginTop: '-4px',
  boxShadow: '0 0 8px 2px rgba(212,162,64,0.7)',
};

const progressMetaRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const progressMetaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

const progressMetaStrong: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--text-secondary)',
};

export default BudgetHero;

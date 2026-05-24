import React from 'react';
import type { BudgetStats } from '../../types';
import { formatCurrency } from '../../utils/formatting';

interface StatsRowProps {
  stats: BudgetStats;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  isNum?: boolean;
}

function StatCard({ icon, label, value, valueColor, isNum }: StatCardProps) {
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
    padding: 'var(--space-3) var(--space-2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    textAlign: 'center',
    minWidth: 0,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '20px',
    lineHeight: 1,
    marginBottom: '2px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    textAlign: 'center',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: valueColor ?? 'var(--text-primary)',
    direction: isNum ? 'ltr' : undefined,
    fontVariantNumeric: isNum ? 'tabular-nums' : undefined,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    textAlign: 'center',
  };

  return (
    <div style={cardStyle}>
      <span style={iconStyle} aria-hidden="true">{icon}</span>
      <span style={valueStyle}>{value}</span>
      <span style={labelStyle}>{label}</span>
    </div>
  );
}

export function StatsRow({ stats }: StatsRowProps) {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 'var(--space-3)',
  };

  const daysValue = stats.daysRemaining === null
    ? '—'
    : stats.daysRemaining < 0
    ? `${Math.abs(stats.daysRemaining)}-`
    : String(stats.daysRemaining);

  const daysColor = stats.daysRemaining !== null && stats.daysRemaining < 14
    ? 'var(--danger)'
    : stats.daysRemaining !== null && stats.daysRemaining < 30
    ? 'var(--warning)'
    : undefined;

  const remainingColor = stats.remaining < 0
    ? 'var(--danger)'
    : stats.remaining < stats.totalBudget * 0.15
    ? 'var(--warning)'
    : 'var(--success)';

  return (
    <div style={gridStyle}>
      <StatCard
        icon="📅"
        label="الأيام المتبقية"
        value={daysValue}
        valueColor={daysColor}
        isNum
      />
      <StatCard
        icon="💸"
        label="المصروف"
        value={formatCurrency(stats.totalSpent)}
        isNum
      />
      <StatCard
        icon="💰"
        label="المتبقي"
        value={formatCurrency(Math.abs(stats.remaining))}
        valueColor={remainingColor}
        isNum
      />
    </div>
  );
}

export default StatsRow;

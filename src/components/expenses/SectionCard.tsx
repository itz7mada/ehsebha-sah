import React from 'react';
import { ChevronRightIcon, CheckIcon } from '../common/Icons';
import { maskAmount } from '../../utils/formatting';
import { getCategoryTotal } from '../../utils/calculations';
import { ProgressBar } from '../common/ProgressBar';
import type { Category, ExpenseItem } from '../../types';

interface SectionCardProps {
  category: Category;
  expenses: ExpenseItem[];
  onClick: () => void;
  hideAmounts?: boolean;
}

type BudgetStatus = 'ok' | 'near' | 'over' | null;

function getBudgetStatus(expected: number, budget: number | undefined): BudgetStatus {
  if (!budget || budget <= 0 || expected === 0) return null;
  const ratio = expected / budget;
  if (ratio > 1) return 'over';
  if (ratio > 0.85) return 'near';
  return 'ok';
}

const BUDGET_STATUS_LABELS: Record<Exclude<BudgetStatus, null>, string> = {
  ok: 'في الميزانية',
  near: 'اقترب من الحد',
  over: 'تجاوز الميزانية',
};

const BUDGET_STATUS_COLORS: Record<Exclude<BudgetStatus, null>, { color: string; bg: string }> = {
  ok: { color: 'var(--success)', bg: 'var(--success-light)' },
  near: { color: 'var(--warning)', bg: 'var(--warning-light)' },
  over: { color: 'var(--danger)', bg: 'var(--danger-light)' },
};

export function SectionCard({ category, expenses, onClick, hideAmounts = false }: SectionCardProps) {
  const totals = getCategoryTotal(expenses, category.id);
  const progressValue = totals.expected > 0 ? (totals.paid / totals.expected) * 100 : 0;
  const allPaid = totals.count > 0 && totals.paidCount === totals.count;
  const remaining = totals.expected - totals.paid;
  const budgetStatus = getBudgetStatus(totals.expected, category.budget);

  const progressColor = allPaid ? 'var(--success)'
    : budgetStatus === 'over' ? 'var(--danger)'
    : budgetStatus === 'near' ? 'var(--warning)'
    : category.color ?? 'var(--accent)';

  const [hovered, setHovered] = React.useState(false);

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: `1px solid ${allPaid ? 'var(--success)' : budgetStatus === 'over' ? 'var(--danger-light)' : 'var(--border-light)'}`,
    boxShadow: hovered
      ? (allPaid ? '0 0 0 2px var(--success-light), var(--shadow-md)' : 'var(--shadow-md)')
      : (allPaid ? '0 0 0 2px var(--success-light)' : 'var(--shadow-sm)'),
    padding: 'var(--space-4)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    transform: hovered ? 'translateY(-1px)' : undefined,
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={`قسم ${category.name}`}
    >
      {/* Top row: dot + name + badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: progressColor,
          }} />
          <span style={{
            fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {category.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          {budgetStatus && !allPaid && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: BUDGET_STATUS_COLORS[budgetStatus].color,
              background: BUDGET_STATUS_COLORS[budgetStatus].bg,
              borderRadius: 'var(--radius-full)', padding: '2px 8px',
              whiteSpace: 'nowrap',
            }}>
              {BUDGET_STATUS_LABELS[budgetStatus]}
            </span>
          )}
          <span style={{
            fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)',
            background: 'var(--bg-secondary)', padding: '2px 8px',
            borderRadius: 'var(--radius-full)', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {totals.count > 0 ? `${totals.count} عناصر` : 'فارغ'}
          </span>
          {allPaid ? (
            <div style={{
              width: '24px', height: '24px', borderRadius: 'var(--radius-full)',
              background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckIcon size={14} color="var(--text-inverse)" />
            </div>
          ) : (
            <ChevronRightIcon size={18} color="var(--text-tertiary)" />
          )}
        </div>
      </div>

      {/* Body */}
      {totals.count === 0 ? (
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-1) 0', margin: 0 }}>
          ابدأ بأول شيء يناسبك
        </p>
      ) : (
        <>
          <ProgressBar value={progressValue} height={5} color={progressColor} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>المخطط</span>
              <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {maskAmount(totals.expected, hideAmounts)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>المدفوع</span>
              <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: totals.paid > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                {maskAmount(totals.paid, hideAmounts)}
              </span>
            </div>
            {remaining > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>المتبقي</span>
                <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--warning)' }}>
                  {maskAmount(remaining, hideAmounts)}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SectionCard;

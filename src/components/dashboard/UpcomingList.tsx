import React from 'react';
import type { ExpenseItem, Category } from '../../types';
import { formatCurrency, getDaysLabel } from '../../utils/formatting';
import { getUpcomingPayments } from '../../utils/calculations';
import { CalendarIcon } from '../common/Icons';

interface UpcomingListProps {
  expenses: ExpenseItem[];
  categories: Category[];
}

interface UpcomingItemProps {
  expense: ExpenseItem;
  category: Category | undefined;
  daysUntil: number;
}

function UpcomingItem({ expense, category, daysUntil }: UpcomingItemProps) {
  const isUrgent = daysUntil < 3;
  const isWarning = daysUntil >= 3 && daysUntil <= 7;

  const dateColor = isUrgent
    ? 'var(--danger)'
    : isWarning
    ? 'var(--warning)'
    : 'var(--text-tertiary)';

  const dateBg = isUrgent
    ? 'var(--danger-light)'
    : isWarning
    ? 'var(--warning-light)'
    : 'var(--bg-secondary)';

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) 0',
    borderBottom: '1px solid var(--border-light)',
  };

  const emojiStyle: React.CSSProperties = {
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const catStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--text-tertiary)',
  };

  const rightStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
  };

  const amountStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    direction: 'ltr',
    fontVariantNumeric: 'tabular-nums',
  };

  const datePillStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    background: dateBg,
    color: dateColor,
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={itemStyle}>
      <div style={emojiStyle} aria-hidden="true">
        {category?.emoji ?? '📋'}
      </div>
      <div style={infoStyle}>
        <span style={nameStyle}>{expense.name}</span>
        {category && <span style={catStyle}>{category.name}</span>}
      </div>
      <div style={rightStyle}>
        <span className="num" style={amountStyle}>
          {formatCurrency(expense.expectedAmount - expense.paidAmount)}
        </span>
        <span style={datePillStyle}>
          <CalendarIcon size={10} color={dateColor} />
          {getDaysLabel(daysUntil)}
        </span>
      </div>
    </div>
  );
}

export function UpcomingList({ expenses, categories }: UpcomingListProps) {
  const upcoming = getUpcomingPayments(expenses);

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-1)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 'var(--space-5) var(--space-4)',
    color: 'var(--text-tertiary)',
    fontSize: 'var(--font-size-sm)',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-light)',
  };

  const listCardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
    padding: '0 var(--space-4)',
    overflow: 'hidden',
  };

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const itemsWithDays = React.useMemo(() => {
    const now = new Date();
    return upcoming.map(expense => {
      const dueDate = new Date(expense.dueDate!);
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { expense, daysUntil };
    });
  }, [upcoming]);

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>القادم</span>
        {upcoming.length > 0 && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {upcoming.length} مدفوعات
          </span>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div style={emptyStyle}>
          لا توجد مدفوعات قريبة 🎉
        </div>
      ) : (
        <div style={listCardStyle}>
          {itemsWithDays.map(({ expense, daysUntil }, idx) => (
            <div
              key={expense.id}
              style={idx === itemsWithDays.length - 1 ? { borderBottom: 'none' } : undefined}
            >
              <UpcomingItem
                expense={expense}
                category={categoryMap.get(expense.categoryId)}
                daysUntil={daysUntil}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingList;

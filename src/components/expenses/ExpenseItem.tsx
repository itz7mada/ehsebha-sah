import React, { useState } from 'react';
import { EditIcon, TrashIcon, CalendarIcon } from '../common/Icons';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { ExpenseItem as ExpenseItemType, Category } from '../../types';
import { STATUS_LABELS, PRIORITY_LABELS, RESPONSIBILITY_LABELS } from '../../types';

interface ExpenseItemProps {
  item: ExpenseItemType;
  onEdit: (item: ExpenseItemType) => void;
  onDelete: (id: string) => void;
  showCategory?: boolean;
  categories?: Category[];
}

const STATUS_CLASS: Record<string, string> = {
  paid: 'status-paid',
  partial: 'status-partial',
  unpaid: 'status-unpaid',
};

const PRIORITY_CLASS: Record<string, string> = {
  essential: 'priority-essential',
  important: 'priority-important',
  luxury: 'priority-luxury',
};

export function ExpenseItem({ item, onEdit, onDelete, showCategory = false, categories = [] }: ExpenseItemProps) {
  const [expanded, setExpanded] = useState(false);

  const remaining = item.expectedAmount - item.paidAmount;
  const isOverdue = !!item.dueDate && item.status !== 'paid' && new Date(item.dueDate) < new Date();
  const category = showCategory ? categories.find(c => c.id === item.categoryId) : null;

  const handleToggle = () => setExpanded(prev => !prev);

  const wrapStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    transition: 'box-shadow var(--transition-fast)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  };

  const mainRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    padding: 'var(--space-4)',
  };

  const topRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-2)',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const badgesRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
  };

  const amountRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--space-3)',
  };

  const paidAmountStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-md)',
    fontWeight: 700,
    color: item.status === 'paid' ? 'var(--success)' : item.status === 'partial' ? 'var(--warning)' : 'var(--text-primary)',
  };

  const expectedAmountStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-tertiary)',
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    flexWrap: 'wrap',
  };

  const metaItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 'var(--font-size-xs)',
    color: isOverdue ? 'var(--danger)' : 'var(--text-tertiary)',
  };

  const notesStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
    lineHeight: '1.5',
  };

  const expandedSectionStyle: React.CSSProperties = {
    borderTop: '1px solid var(--border-light)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--bg-secondary)',
  };

  const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBlock: 'var(--space-1)',
  };

  const detailLabelStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--text-tertiary)',
  };

  const detailValueStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--text-primary)',
  };

  const actionRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-3)',
  };

  return (
    <div style={wrapStyle} onClick={handleToggle} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }} aria-expanded={expanded}>
      <div style={mainRowStyle}>
        {/* Row 1: status + name + priority */}
        <div style={topRowStyle}>
          <span style={nameStyle}>{item.name}</span>
          <div style={badgesRowStyle}>
            <span className={`status-badge ${STATUS_CLASS[item.status]}`}>
              {STATUS_LABELS[item.status]}
            </span>
            <span className={`status-badge ${PRIORITY_CLASS[item.priority]}`}>
              {PRIORITY_LABELS[item.priority]}
            </span>
          </div>
        </div>

        {/* Row 2: amounts */}
        <div style={amountRowStyle}>
          <span className="num" style={paidAmountStyle}>{formatCurrency(item.paidAmount)}</span>
          <span style={expectedAmountStyle}>
            من <span className="num">{formatCurrency(item.expectedAmount)}</span>
          </span>
          {remaining > 0 && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginInlineStart: 'auto' }}>
              متبقي <span className="num">{formatCurrency(remaining)}</span>
            </span>
          )}
        </div>

        {/* Row 3: due date + category */}
        {(item.dueDate || showCategory) && (
          <div style={metaRowStyle}>
            {showCategory && category && (
              <span style={{ ...metaItemStyle, color: 'var(--text-secondary)' }}>
                <span>{category.emoji}</span>
                <span>{category.name}</span>
              </span>
            )}
            {item.dueDate && (
              <span style={{ ...metaItemStyle, color: isOverdue ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                <CalendarIcon size={11} color={isOverdue ? 'var(--danger)' : 'currentColor'} />
                <span>{isOverdue ? 'متأخر: ' : ''}{formatDate(item.dueDate)}</span>
              </span>
            )}
          </div>
        )}

        {/* Row 4: notes */}
        {item.notes && !expanded && (
          <p style={notesStyle}>{item.notes}</p>
        )}
      </div>

      {/* Expanded detail section */}
      {expanded && (
        <div style={expandedSectionStyle} onClick={e => e.stopPropagation()}>
          <div style={detailRowStyle}>
            <span style={detailLabelStyle}>المسؤولية</span>
            <span style={detailValueStyle}>{RESPONSIBILITY_LABELS[item.responsibility]}</span>
          </div>
          {item.dueDate && (
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>تاريخ الاستحقاق</span>
              <span style={{ ...detailValueStyle, color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                {formatDate(item.dueDate)}{isOverdue ? ' (متأخر)' : ''}
              </span>
            </div>
          )}
          {item.notes && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <span style={detailLabelStyle}>ملاحظات</span>
              <p style={{ ...notesStyle, marginTop: '4px', color: 'var(--text-secondary)' }}>{item.notes}</p>
            </div>
          )}
          <div style={actionRowStyle}>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              icon={<EditIcon size={15} />}
              onClick={() => onEdit(item)}
            >
              تعديل
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              icon={<TrashIcon size={15} />}
              onClick={() => onDelete(item.id)}
            >
              حذف
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseItem;

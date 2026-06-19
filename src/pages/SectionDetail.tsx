import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AddExpenseSheet } from '../components/expenses/AddExpenseSheet';
import { AddPaymentSheet } from '../components/expenses/AddPaymentSheet';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { PlusIcon, TrashIcon, EditIcon } from '../components/common/Icons';
import * as db from '../db/database';
import { formatCurrency, normalizeArabicName } from '../utils/formatting';
import { getCategoryTotal } from '../utils/calculations';
import { getSuggestionsForCategory } from '../utils/suggestions';
import type { ExpenseItem, PaymentStatus } from '../types';
import { STATUS_LABELS } from '../types';

type FilterTab = 'all' | PaymentStatus;

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'unpaid', label: STATUS_LABELS.unpaid },
  { key: 'partial', label: STATUS_LABELS.partial },
  { key: 'paid', label: STATUS_LABELS.paid },
];

function StatusCircle({ status }: { status: PaymentStatus }) {
  if (status === 'paid') {
    return (
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === 'partial') {
    return (
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2.5px solid var(--warning)',
        background: 'var(--warning-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
      </div>
    );
  }
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      border: '2.5px solid var(--border)',
      flexShrink: 0,
    }} />
  );
}

function ChecklistRow({
  item,
  onEdit,
  onDelete,
  onAddPayment,
}: {
  item: ExpenseItem;
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: string) => void;
  onAddPayment: (item: ExpenseItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusText = item.status === 'paid' ? 'مكتمل'
    : item.status === 'partial' ? `دُفع ${formatCurrency(item.paidAmount)}`
    : 'لم يبدأ بعد';
  const statusColor = item.status === 'paid' ? 'var(--success)'
    : item.status === 'partial' ? 'var(--warning)'
    : 'var(--text-tertiary)';

  return (
    <div style={rowWrapStyle}>
      <button
        type="button"
        style={rowMainStyle}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <StatusCircle status={item.status} />
        <div style={rowInfoStyle}>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: item.status === 'paid' ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: item.status === 'paid' ? 'line-through' : 'none',
          }}>
            {item.name}
          </span>
          <span style={{ fontSize: '11px', color: statusColor, fontWeight: 500 }}>
            {statusText}
          </span>
        </div>
        <div style={rowAmountStyle}>
          <span className="num" style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            color: item.status === 'paid' ? 'var(--success)' : 'var(--text-primary)',
          }}>
            {formatCurrency(item.expectedAmount)}
          </span>
        </div>
      </button>

      {expanded && (
        <>
          {item.paidAmount > 0 && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-5)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500 }}>المدفوع</span>
                <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--success)' }}>
                  {formatCurrency(item.paidAmount)}
                </span>
              </div>
              {item.dueDate && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500 }}>التاريخ</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {new Date(item.dueDate).toLocaleDateString('ar', { month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
              {(item.images?.[0] ?? item.imageData) && (
                <div style={{ marginRight: 'auto', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)', flexShrink: 0 }}>
                  <img src={item.images?.[0] ?? item.imageData!} alt="إيصال" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              {(item.images?.length ?? 0) > 1 && (
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  +{(item.images?.length ?? 1) - 1}
                </span>
              )}
            </div>
          )}
          {item.notes && (
            <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6 }}>{item.notes}</p>
            </div>
          )}
          <div style={rowActionsStyle}>
            <button
              type="button"
              style={{ ...actionBtnStyle('var(--accent)'), borderInlineEnd: '1px solid var(--border-light)' }}
              onClick={() => { setExpanded(false); onEdit(item); }}
            >
              <EditIcon size={14} />
              <span>تعديل</span>
            </button>
            <button
              type="button"
              style={{ ...actionBtnStyle('var(--success)'), borderInlineEnd: '1px solid var(--border-light)' }}
              onClick={() => { setExpanded(false); onAddPayment(item); }}
            >
              <PlusIcon size={14} />
              <span>إضافة دفعة</span>
            </button>
            <button
              type="button"
              style={actionBtnStyle('var(--danger)')}
              onClick={() => { setExpanded(false); onDelete(item.id); }}
            >
              <TrashIcon size={14} />
              <span>حذف</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const rowWrapStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-light)',
  overflow: 'hidden',
};

const rowMainStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'start',
  fontFamily: 'var(--font-family)',
};

const rowInfoStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  textAlign: 'start',
};

const rowAmountStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px',
  flexShrink: 0,
};

const rowActionsStyle: React.CSSProperties = {
  display: 'flex',
  borderTop: '1px solid var(--border-light)',
};

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-2)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color,
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    fontFamily: 'var(--font-family)',
  };
}

export function SectionDetail() {
  const { id: categoryId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [quickAddName, setQuickAddName] = useState<string | undefined>(undefined);
  const [showDeleteCatConfirm, setShowDeleteCatConfirm] = useState(false);
  const [paymentItem, setPaymentItem] = useState<ExpenseItem | null>(null);

  const category = state.categories.find(c => c.id === categoryId);
  const totals = getCategoryTotal(state.expenses, categoryId ?? '');

  const filtered = useMemo(() => {
    const catExpenses = state.expenses.filter(e => e.categoryId === categoryId);
    if (filter === 'all') return catExpenses;
    return catExpenses.filter(e => e.status === filter);
  }, [state.expenses, categoryId, filter]);

  const progressValue = totals.expected > 0 ? (totals.paid / totals.expected) * 100 : 0;
  const remaining = totals.expected - totals.paid;

  const handleEdit = (item: ExpenseItem) => {
    setEditItem(item);
    setQuickAddName(undefined);
    setSheetOpen(true);
  };

  const handleAddNew = (name?: string) => {
    setEditItem(undefined);
    setQuickAddName(name);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setEditItem(undefined);
    setQuickAddName(undefined);
  };

  const handleDeleteCategory = async () => {
    if (!category) return;
    try {
      const catExpenses = state.expenses.filter(e => e.categoryId === category.id);
      await db.deleteJourneyEventsByCategory(category.id);
      await Promise.all(catExpenses.map(e => db.deleteExpense(e.id)));
      await db.deleteCategory(category.id);
      dispatch({ type: 'REMOVE_JOURNEY_BY_CATEGORY', payload: category.id });
      catExpenses.forEach(e => dispatch({ type: 'DELETE_EXPENSE', payload: e.id }));
      dispatch({ type: 'SET_CATEGORIES', payload: state.categories.filter(c => c.id !== category.id) });
      navigate(-1);
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setShowDeleteCatConfirm(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await db.deleteJourneyEventsByExpense(deleteTarget);
      await db.deleteExpense(deleteTarget);
      dispatch({ type: 'REMOVE_JOURNEY_BY_EXPENSE', payload: deleteTarget });
      dispatch({ type: 'DELETE_EXPENSE', payload: deleteTarget });
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!category) {
    return (
      <div className="page">
        <div className="page-content">
          <div className="empty-state">
            <h3>البند الرئيسي غير موجود</h3>
            <p>ربما تم حذف هذا البند</p>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="secondary" onClick={() => navigate(-1)}>العودة</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const suggestions = getSuggestionsForCategory(category.name);
  // Suggestions persist; only the ones already added (by normalized name) drop off.
  const existingNames = new Set(
    state.expenses.filter(e => e.categoryId === categoryId).map(e => normalizeArabicName(e.name)),
  );
  const remainingSuggestions = suggestions.filter(s => !existingNames.has(normalizeArabicName(s)));
  const deleteTargetItem = deleteTarget ? state.expenses.find(e => e.id === deleteTarget) : null;

  return (
    <div className="page">
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
            <button type="button" style={backBtnStyle} onClick={() => navigate(-1)} aria-label="رجوع">
              &#8592;
            </button>
            <h1 style={titleStyle}>
              <span aria-hidden="true">{category.emoji}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {category.name}
              </span>
            </h1>
            <Button variant="primary" size="sm" icon={<PlusIcon size={15} />} onClick={() => handleAddNew()}>
              إضافة بند
            </Button>
          </div>
        </div>
      </div>

      <div className="page-content pb-safe animate-fade-in">

        {/* Summary card */}
        {totals.count > 0 && (
          <div style={summaryStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>المتوقع</span>
                <span className="num" style={statValueStyle}>{formatCurrency(totals.expected)}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>المدفوع</span>
                <span className="num" style={{ ...statValueStyle, color: totals.paid > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {formatCurrency(totals.paid)}
                </span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>المتبقي</span>
                <span className="num" style={{ ...statValueStyle, color: remaining > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>
            <ProgressBar value={progressValue} height={6} color={category.color ?? 'var(--accent)'} showLabel />
          </div>
        )}

        {/* Filter Tabs */}
        {totals.count > 0 && (
          <div style={filterTabsStyle}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                style={filterTabStyle(filter === f.key)}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Checklist heading */}
        {totals.count > 0 && (
          <h2 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', letterSpacing: '0.04em' }}>
            البنود
          </h2>
        )}

        {/* Empty category — friendly invite + ready suggestions + clear add button */}
        {totals.count === 0 && (
          <div style={emptyInviteStyle}>
            <h3 style={emptyInviteTitleStyle}>ما أضفت شيء في {category.name} للحين</h3>
            <p style={emptyInviteTextStyle}>اختر من الاقتراحات، أو أضف بند خاص فيك.</p>
            {remainingSuggestions.length > 0 && (
              <div style={emptyChipsRowStyle}>
                {remainingSuggestions.map(name => (
                  <button key={name} type="button" style={suggestionChipStyle} onClick={() => handleAddNew(name)}>
                    + {name}
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => handleAddNew()}>
                إضافة بند
              </Button>
            </div>
          </div>
        )}

        {/* Has items, but none match the active filter */}
        {totals.count > 0 && filtered.length === 0 && (
          <div className="empty-state">
            <h3>ما فيه بنود بهذا الفلتر</h3>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {filtered.map(item => (
              <ChecklistRow
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={id => setDeleteTarget(id)}
                onAddPayment={setPaymentItem}
              />
            ))}
          </div>
        )}

        {/* Add more from suggestions — only when the category already has items */}
        {totals.count > 0 && filter === 'all' && remainingSuggestions.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 'var(--space-3)', letterSpacing: '0.04em' }}>
              اقتراحات للإضافة
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {remainingSuggestions.map(name => (
                <button
                  key={name}
                  type="button"
                  style={suggestionChipStyle}
                  onClick={() => handleAddNew(name)}
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete category */}
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowDeleteCatConfirm(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-5)',
              background: 'transparent',
              border: '1px solid var(--danger-light)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--danger)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
            }}
          >
            <TrashIcon size={13} />
            <span>حذف البند الرئيسي</span>
          </button>
        </div>
      </div>

      <AddExpenseSheet
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        editItem={editItem}
        defaultCategoryId={categoryId}
        defaultName={quickAddName}
      />

      <AddPaymentSheet
        isOpen={!!paymentItem}
        onClose={() => setPaymentItem(null)}
        item={paymentItem}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="حذف البند"
        message={`هل تريد حذف "${deleteTargetItem?.name ?? 'هذا البند'}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showDeleteCatConfirm}
        onClose={() => setShowDeleteCatConfirm(false)}
        onConfirm={handleDeleteCategory}
        title="حذف البند الرئيسي؟"
        message="سيتم حذف هذا البند وكل العناصر والدفعات المرتبطة به. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: 'var(--bg-primary)',
  borderBottom: '1px solid var(--border-light)',
  padding: 'var(--space-3) var(--space-4)',
  paddingTop: 'var(--page-top)',
  maxWidth: '480px',
  margin: '0 auto',
  width: '100%',
};

const backBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--bg-secondary)',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  fontSize: '18px',
  flexShrink: 0,
  fontFamily: 'var(--font-family)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-md)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flex: 1,
  minWidth: 0,
};

const summaryStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-light)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-4)',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  alignItems: 'center',
  textAlign: 'center',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const filterTabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-4)',
  overflowX: 'auto',
  paddingBottom: '2px',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
};

function filterTabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-secondary)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all var(--transition-fast)',
    fontFamily: 'var(--font-family)',
    flexShrink: 0,
  };
}

const emptyInviteStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-8) var(--space-4) var(--space-4)',
};

const emptyInviteTitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-md)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: 0,
};

const emptyInviteTextStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  margin: 0,
  lineHeight: 1.6,
};

const emptyChipsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
  justifyContent: 'center',
  marginTop: 'var(--space-2)',
};

const suggestionChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  transition: 'all var(--transition-fast)',
};

export default SectionDetail;

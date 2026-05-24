import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AddExpenseSheet } from '../components/expenses/AddExpenseSheet';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';
import { PlusIcon, TrashIcon, EditIcon } from '../components/common/Icons';
import * as db from '../db/database';
import { formatCurrency } from '../utils/formatting';
import { getCategoryTotal } from '../utils/calculations';
import type { ExpenseItem, PaymentStatus } from '../types';
import { STATUS_LABELS } from '../types';

type FilterTab = 'all' | PaymentStatus;

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'unpaid', label: STATUS_LABELS.unpaid },
  { key: 'partial', label: STATUS_LABELS.partial },
  { key: 'paid', label: STATUS_LABELS.paid },
];

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  'المهر': ['خاتم الخطوبة', 'مهر السيدة', 'المبرم'],
  'الزهبة': ['ذهب العروس', 'سوار', 'مصوغات'],
  'الملجة': ['فستان الزفاف', 'لبس العريس', 'عباءة العروس', 'حذاء العروس'],
  'العرس': ['قاعة الرجال', 'قاعة الحريم', 'الذبايح', 'العشاء', 'ديكور القاعة', 'الموسيقى'],
  'السكن': ['إيجار الشقة', 'أثاث غرفة النوم', 'أثاث المطبخ', 'أجهزة منزلية'],
  'شهر العسل': ['تذاكر طيران', 'إقامة الفندق', 'رحلات وجولات'],
  'أخرى': ['مصاريف متنوعة'],
};

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
}: {
  item: ExpenseItem;
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

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
        </div>
        <div style={rowAmountStyle}>
          <span className="num" style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            color: item.status === 'paid' ? 'var(--success)' : 'var(--text-primary)',
          }}>
            {formatCurrency(item.expectedAmount)}
          </span>
          {item.paidAmount > 0 && item.paidAmount < item.expectedAmount && (
            <span className="num" style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 500 }}>
              دُفع {formatCurrency(item.paidAmount)}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div style={rowActionsStyle}>
          <button
            type="button"
            style={actionBtnStyle('var(--accent)')}
            onClick={() => { setExpanded(false); onEdit(item); }}
          >
            <EditIcon size={14} />
            <span>تعديل</span>
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

  const suggestions = CATEGORY_SUGGESTIONS[category.name] ?? [];
  const showSuggestions = totals.count === 0 && suggestions.length > 0;
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
              إضافة عنصر
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
        <h2 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', letterSpacing: '0.04em' }}>
          العناصر
        </h2>

        {/* Checklist items */}
        {filtered.length === 0 && !showSuggestions && (
          <div className="empty-state">
            <h3>لا توجد عناصر بعد</h3>
            <p>أضف أول عنصر في هذا البند الرئيسي</p>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="primary" icon={<PlusIcon size={16} />} onClick={() => handleAddNew()}>
                إضافة عنصر
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 && filter !== 'all' && (
          <div className="empty-state">
            <h3>لا توجد عناصر بهذا الفلتر</h3>
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
              />
            ))}
          </div>
        )}

        {/* Suggested items when empty */}
        {showSuggestions && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 'var(--space-2)', letterSpacing: '0.04em' }}>
              اقتراحات للبدء
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {suggestions.map(name => (
                <button
                  key={name}
                  type="button"
                  style={suggestionRowStyle}
                  onClick={() => handleAddNew(name)}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: '2px solid var(--border-light)',
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', textAlign: 'start' }}>
                    {name}
                  </span>
                  <PlusIcon size={14} color="var(--accent)" />
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="حذف العنصر"
        message={`هل تريد حذف "${deleteTargetItem?.name ?? 'هذا العنصر'}"؟`}
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

const suggestionRowStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-light)',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  transition: 'all var(--transition-fast)',
};

export default SectionDetail;

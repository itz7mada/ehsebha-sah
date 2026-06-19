import React, { useEffect, useState } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { ChevronRightIcon } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import * as db from '../../db/database';
import { generateId, now, normalizeArabicName } from '../../utils/formatting';
import { getSuggestionsForCategory } from '../../utils/suggestions';
import type { ExpenseItem, Category } from '../../types';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** A chosen/created item is ready to record a payment against. */
  onRecordPayment: (item: ExpenseItem) => void;
  /** A category was chosen to add a new item into. */
  onAddItem: (categoryId: string) => void;
  onAddSupport: () => void;
  onEditBudget: () => void;
}

type Screen = 'chooser' | 'payCategory' | 'payItem' | 'itemCategory';

const CHOICES: { key: 'pay' | 'item' | 'support' | 'budget'; label: string; hint: string; dot: string }[] = [
  { key: 'pay',     label: 'إضافة دفعة',     hint: 'مبلغ دفعته على بند',        dot: 'var(--success)' },
  { key: 'item',    label: 'إضافة بند',      hint: 'بند جديد في خطتك',          dot: 'var(--accent)' },
  { key: 'support', label: 'إضافة مساهمة',   hint: 'مساهمة من الأهل أو غيرهم',  dot: 'var(--info)' },
  { key: 'budget',  label: 'تعديل الميزانية', hint: 'حدّث ميزانيتك الإجمالية',   dot: 'var(--warning)' },
];

export function QuickAddSheet({ isOpen, onClose, onRecordPayment, onAddItem, onAddSupport, onEditBudget }: QuickAddSheetProps) {
  const { state, dispatch } = useApp();
  const [screen, setScreen] = useState<Screen>('chooser');
  const [categoryId, setCategoryId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setScreen('chooser');
      setCategoryId('');
    }
  }, [isOpen]);

  const activeCategories = state.categories
    .filter((c) => c.isActive && c.name !== 'الطوارئ')
    .sort((a, b) => a.order - b.order);

  const selectedCategory = activeCategories.find((c) => c.id === categoryId);
  const itemsInCategory = state.expenses.filter((e) => e.categoryId === categoryId);
  const existingNames = new Set(itemsInCategory.map((e) => normalizeArabicName(e.name)));
  const remainingSuggestions = selectedCategory
    ? getSuggestionsForCategory(selectedCategory.name).filter((s) => !existingNames.has(normalizeArabicName(s)))
    : [];

  function handleChoice(key: 'pay' | 'item' | 'support' | 'budget') {
    if (key === 'support') { onAddSupport(); return; }
    if (key === 'budget') { onEditBudget(); return; }
    setScreen(key === 'pay' ? 'payCategory' : 'itemCategory');
  }

  function pickCategory(cat: Category) {
    setCategoryId(cat.id);
    if (screen === 'payCategory') {
      setScreen('payItem');
    } else {
      onAddItem(cat.id);
    }
  }

  async function createItemAndPay(name: string) {
    if (!selectedCategory) return;
    const item: ExpenseItem = {
      id: generateId(),
      categoryId: selectedCategory.id,
      name,
      expectedAmount: 0,
      paidAmount: 0,
      status: 'unpaid',
      priority: 'important',
      responsibility: 'shared',
      createdAt: now(),
      updatedAt: now(),
    };
    await db.saveExpense(item);
    dispatch({ type: 'UPSERT_EXPENSE', payload: item });
    const ev = {
      id: generateId(),
      type: 'expense_added' as const,
      title: `أضفت "${name}"`,
      amount: 0,
      categoryId: selectedCategory.id,
      expenseId: item.id,
      date: now(),
    };
    await db.addJourneyEvent(ev);
    dispatch({ type: 'ADD_JOURNEY', payload: ev });
    onRecordPayment(item);
  }

  const title =
    screen === 'chooser' ? 'إضافة سريعة'
    : screen === 'payItem' ? 'أي بند؟'
    : screen === 'payCategory' ? 'في أي قسم؟'
    : 'لأي قسم؟';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {screen !== 'chooser' && (
          <button
            type="button"
            style={backBtnStyle}
            onClick={() => setScreen(screen === 'payItem' ? 'payCategory' : 'chooser')}
          >
            <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}>
              <ChevronRightIcon size={16} color="var(--text-secondary)" />
            </span>
            رجوع
          </button>
        )}

        {/* Chooser */}
        {screen === 'chooser' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {CHOICES.map((c) => (
              <button key={c.key} type="button" style={rowStyle} onClick={() => handleChoice(c.key)}>
                <span style={{ ...dotStyle, background: c.dot }} aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={rowLabelStyle}>{c.label}</span>
                  <span style={rowHintStyle}>{c.hint}</span>
                </span>
                <ChevronRightIcon size={18} color="var(--text-tertiary)" />
              </button>
            ))}
          </div>
        )}

        {/* Category picker (payment or add-item) */}
        {(screen === 'payCategory' || screen === 'itemCategory') && (
          activeCategories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {activeCategories.map((cat) => {
                const count = state.expenses.filter((e) => e.categoryId === cat.id).length;
                return (
                  <button key={cat.id} type="button" style={rowStyle} onClick={() => pickCategory(cat)}>
                    <span style={{ ...dotStyle, background: cat.color ?? 'var(--accent)' }} aria-hidden="true" />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={rowLabelStyle}>{cat.name}</span>
                      {count > 0 && <span style={rowHintStyle}>{count} عناصر</span>}
                    </span>
                    <ChevronRightIcon size={18} color="var(--text-tertiary)" />
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={emptyHintStyle}>ما عندك أقسام بعد. أضف قسم من الصفحة الرئيسية أول.</p>
          )
        )}

        {/* Item picker (payment flow) */}
        {screen === 'payItem' && selectedCategory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {itemsInCategory.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {itemsInCategory.map((item) => (
                  <button key={item.id} type="button" style={rowStyle} onClick={() => onRecordPayment(item)}>
                    <span style={{ ...dotStyle, background: statusDot(item) }} aria-hidden="true" />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={rowLabelStyle}>{item.name}</span>
                      <span style={rowHintStyle}>{statusText(item)}</span>
                    </span>
                    <ChevronRightIcon size={18} color="var(--text-tertiary)" />
                  </button>
                ))}
              </div>
            )}

            {remainingSuggestions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={sectionHintStyle}>أو ابدأ بواحد من هذي</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {remainingSuggestions.map((name) => (
                    <button key={name} type="button" style={chipStyle} onClick={() => createItemAndPay(name)}>
                      + {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {itemsInCategory.length === 0 && remainingSuggestions.length === 0 && (
              <button type="button" style={addItemBtnStyle} onClick={() => onAddItem(selectedCategory.id)}>
                + أضف أول بند في {selectedCategory.name}
              </button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function statusDot(item: ExpenseItem): string {
  return item.status === 'paid' ? 'var(--success)' : item.status === 'partial' ? 'var(--warning)' : 'var(--text-tertiary)';
}
function statusText(item: ExpenseItem): string {
  return item.status === 'paid' ? 'مدفوع' : item.status === 'partial' ? 'دفعة جزئية' : 'لم يبدأ بعد';
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  minHeight: '52px',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  textAlign: 'start',
  width: '100%',
  transition: 'all var(--transition-fast)',
  WebkitTapHighlightColor: 'transparent',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const dotStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  flexShrink: 0,
};

const rowLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const rowHintStyle: React.CSSProperties = {
  display: 'block',
  margin: '2px 0 0',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  lineHeight: 1.4,
};

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  alignSelf: 'flex-start',
  padding: '4px 6px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  fontFamily: 'var(--font-family)',
  WebkitTapHighlightColor: 'transparent',
};

const sectionHintStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
  letterSpacing: '0.02em',
};

const chipStyle: React.CSSProperties = {
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

const addItemBtnStyle: React.CSSProperties = {
  ...chipStyle,
  justifyContent: 'center',
  width: '100%',
  padding: 'var(--space-3)',
  borderStyle: 'dashed',
  color: 'var(--accent)',
};

const emptyHintStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  textAlign: 'center',
  lineHeight: 1.7,
  margin: 'var(--space-4) 0',
};

export default QuickAddSheet;

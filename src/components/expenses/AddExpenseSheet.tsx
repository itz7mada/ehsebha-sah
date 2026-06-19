import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PlusIcon } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import * as db from '../../db/database';
import { generateId, now, parseCurrencyInput } from '../../utils/formatting';
import { isOptionalPositiveAmount, AMOUNT_POSITIVE_ERROR } from '../../utils/validation';
import { deriveExpenseStatus } from '../../utils/calculations';
import type { ExpenseItem } from '../../types';

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ExpenseItem;
  defaultCategoryId?: string;
  defaultName?: string;
}

export function AddExpenseSheet({ isOpen, onClose, editItem, defaultCategoryId, defaultName }: AddExpenseSheetProps) {
  const { state, dispatch } = useApp();
  const { show } = useToast();

  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (editItem) {
      setName(editItem.name);
      setAmountRaw(editItem.expectedAmount > 0 ? String(editItem.expectedAmount) : '');
      setNotes(editItem.notes ?? '');
      setShowNotes(!!editItem.notes);
    } else {
      setName(defaultName ?? '');
      setAmountRaw('');
      setNotes('');
      setShowNotes(false);
    }
  }, [isOpen, editItem, defaultName]);

  const amount = parseCurrencyInput(amountRaw);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'أدخل اسم البند';
    // Planned amount is optional, but a typed value must be > 0.
    if (!isOptionalPositiveAmount(amountRaw)) errs.amount = AMOUNT_POSITIVE_ERROR;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const categoryId = editItem?.categoryId ?? defaultCategoryId ?? state.categories.find(c => c.isActive)?.id ?? '';
    try {
      const expense: ExpenseItem = {
        id: editItem?.id ?? generateId(),
        categoryId,
        name: name.trim(),
        expectedAmount: amount,
        // Preserve the payment, but keep status consistent with the numbers.
        paidAmount: editItem?.paidAmount ?? 0,
        status: deriveExpenseStatus(editItem?.paidAmount ?? 0, amount),
        dueDate: editItem?.dueDate,
        notes: notes.trim() || undefined,
        imageData: editItem?.imageData,
        images: editItem?.images,
        priority: editItem?.priority ?? 'important',
        responsibility: editItem?.responsibility ?? 'shared',
        createdAt: editItem?.createdAt ?? now(),
        updatedAt: now(),
      };

      await db.saveExpense(expense);
      dispatch({ type: 'UPSERT_EXPENSE', payload: expense });

      if (!editItem) {
        const addEvent = {
          id: generateId(),
          type: 'expense_added' as const,
          title: `أضفت "${expense.name}"`,
          amount: expense.expectedAmount,
          categoryId: expense.categoryId,
          expenseId: expense.id,
          date: now(),
        };
        await db.addJourneyEvent(addEvent);
        dispatch({ type: 'ADD_JOURNEY', payload: addEvent });
      }

      show('تم الحفظ ✓');
      onClose();
    } catch (err) {
      console.error('Failed to save expense:', err);
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length > 0;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? 'تعديل بند' : 'إضافة بند'}
      footer={
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={saving}
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {editItem ? 'حفظ' : 'إضافة بند'}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {!editItem && (
          <p style={subtitleStyle}>
            اكتب اسم البند، والمبلغ اختياري.
          </p>
        )}

        <Input
          label="اسم البند"
          value={name}
          onChange={setName}
          placeholder="مثال: التصوير أو القاعة"
          error={errors.name}
          autoFocus={!editItem}
        />

        <Input
          label="المبلغ المخطط (اختياري)"
          value={amountRaw}
          onChange={setAmountRaw}
          type="number"
          placeholder="0"
          prefix="د.إ"
          error={errors.amount}
        />

        {!showNotes && (
          <div>
            <button type="button" style={ghostBtnStyle} onClick={() => setShowNotes(true)}>
              <PlusIcon size={15} color="var(--text-secondary)" />
              <span>إضافة ملاحظة</span>
            </button>
          </div>
        )}

        {showNotes && (
          <Input
            label="ملاحظة"
            value={notes}
            onChange={setNotes}
            placeholder="أي تفاصيل بسيطة تبي تتذكرها لاحقاً"
            multiline
            rows={2}
            autoFocus
          />
        )}

      </div>
    </BottomSheet>
  );
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  margin: 0,
  lineHeight: 1.6,
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '9px 14px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  fontFamily: 'var(--font-family)',
  WebkitTapHighlightColor: 'transparent',
};

export default AddExpenseSheet;

import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useApp } from '../../context/AppContext';
import * as db from '../../db/database';
import { generateId, now, parseCurrencyInput } from '../../utils/formatting';
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

  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (editItem) {
      setName(editItem.name);
      setAmountRaw(editItem.expectedAmount > 0 ? String(editItem.expectedAmount) : '');
      setNotes(editItem.notes ?? '');
    } else {
      setName(defaultName ?? '');
      setAmountRaw('');
      setNotes('');
    }
  }, [isOpen, editItem, defaultName]);

  const amount = parseCurrencyInput(amountRaw);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'أدخل اسم العنصر';
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
        // Preserve existing payment data (only AddPaymentSheet changes these)
        paidAmount: editItem?.paidAmount ?? 0,
        status: editItem?.status ?? 'unpaid',
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
      title={editItem ? 'تعديل العنصر' : 'إضافة عنصر'}
      snapHeight="full"
      footer={
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={saving}
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {editItem ? 'تحديث العنصر' : 'إضافة العنصر'}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {!editItem && (
          <p style={subtitleStyle}>
            اكتب الشي اللي تبغي ترتبه داخل هذا البند، وحط له مبلغ تقريبي إذا حبيت.
          </p>
        )}

        <Input
          label="اسم العنصر"
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
        />

        <Input
          label="ملاحظة (اختياري)"
          value={notes}
          onChange={setNotes}
          placeholder="أي تفاصيل بسيطة تبي تتذكرها لاحقاً"
          multiline
          rows={2}
        />

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

export default AddExpenseSheet;

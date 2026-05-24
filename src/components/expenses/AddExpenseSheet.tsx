import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useApp } from '../../context/AppContext';
import * as db from '../../db/database';
import { formatCurrency, generateId, now, parseCurrencyInput } from '../../utils/formatting';
import type { ExpenseItem, PaymentStatus } from '../../types';

type TransactionKind = 'scheduled' | 'partial' | 'paid';

const KIND_LABELS: Record<TransactionKind, string> = {
  scheduled: 'مجدول',
  partial: 'جزئي',
  paid: 'مدفوع',
};

const KINDS: TransactionKind[] = ['scheduled', 'partial', 'paid'];

function kindFromItem(item: ExpenseItem): TransactionKind {
  if (item.status === 'paid') return 'paid';
  if (item.status === 'partial') return 'partial';
  return 'scheduled';
}

function statusFromKind(kind: TransactionKind): PaymentStatus {
  if (kind === 'paid') return 'paid';
  if (kind === 'partial') return 'partial';
  return 'unpaid';
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > height && width > MAX) {
        height = Math.round((height * MAX) / width);
        width = MAX;
      } else if (height > MAX) {
        width = Math.round((width * MAX) / height);
        height = MAX;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: ExpenseItem;
  defaultCategoryId?: string;
  defaultName?: string;
}

export function AddExpenseSheet({ isOpen, onClose, editItem, defaultCategoryId, defaultName }: AddExpenseSheetProps) {
  const { state, dispatch } = useApp();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [kind, setKind] = useState<TransactionKind>('scheduled');
  const [partialRaw, setPartialRaw] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [imageData, setImageData] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (editItem) {
      setName(editItem.name);
      setAmountRaw(editItem.expectedAmount > 0 ? String(editItem.expectedAmount) : '');
      setKind(kindFromItem(editItem));
      setPartialRaw(editItem.paidAmount > 0 && editItem.status === 'partial' ? String(editItem.paidAmount) : '');
      setDueDate(editItem.dueDate ?? '');
      setNotes(editItem.notes ?? '');
      setImageData(editItem.imageData);
    } else {
      setName(defaultName ?? '');
      setAmountRaw('');
      setKind('scheduled');
      setPartialRaw('');
      setDueDate('');
      setNotes('');
      setImageData(undefined);
    }
  }, [isOpen, editItem, defaultName]);

  const amount = parseCurrencyInput(amountRaw);
  const partialAmount = parseCurrencyInput(partialRaw);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'أدخل الوصف';
    if (amount <= 0) errs.amount = 'أدخل مبلغًا أكبر من صفر';
    if (kind === 'partial') {
      if (partialAmount <= 0) errs.partial = 'أدخل المبلغ المدفوع';
      else if (partialAmount >= amount && amount > 0) errs.partial = 'المدفوع أكبر من أو يساوي المبلغ';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const compressed = await compressImage(file);
      setImageData(compressed);
    } catch {
      // ignore image errors
    }
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const categoryId = editItem?.categoryId ?? defaultCategoryId ?? state.categories.find(c => c.isActive)?.id ?? '';
    try {
      const paidAmount = kind === 'paid' ? amount : kind === 'partial' ? partialAmount : 0;
      const status = statusFromKind(kind);
      const isNew = !editItem;

      const expense: ExpenseItem = {
        id: editItem?.id ?? generateId(),
        categoryId,
        name: name.trim(),
        expectedAmount: amount,
        paidAmount,
        status,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        imageData,
        priority: editItem?.priority ?? 'important',
        responsibility: editItem?.responsibility ?? 'shared',
        createdAt: editItem?.createdAt ?? now(),
        updatedAt: now(),
      };

      await db.saveExpense(expense);
      dispatch({ type: 'UPSERT_EXPENSE', payload: expense });

      if (isNew) {
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

      if (paidAmount > 0 && paidAmount !== (editItem?.paidAmount ?? 0)) {
        const payEvent = {
          id: generateId(),
          type: 'payment_made' as const,
          title: `دفعت ${formatCurrency(paidAmount)} لـ "${expense.name}"`,
          amount: paidAmount,
          categoryId: expense.categoryId,
          expenseId: expense.id,
          date: now(),
        };
        await db.addJourneyEvent(payEvent);
        dispatch({ type: 'ADD_JOURNEY', payload: payEvent });
      }

      onClose();
    } catch (err) {
      console.error('Failed to save expense:', err);
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length > 0 && amount > 0 && (kind !== 'partial' || partialAmount > 0);

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
          {editItem ? 'حفظ التعديلات' : 'إضافة'}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {/* 1. الوصف */}
        <Input
          label="الوصف"
          value={name}
          onChange={setName}
          placeholder="مثال: دفعة القاعة"
          error={errors.name}
          autoFocus={!editItem}
        />

        {/* 2. المبلغ */}
        <Input
          label="المبلغ"
          value={amountRaw}
          onChange={setAmountRaw}
          type="number"
          placeholder="0"
          prefix="د.إ"
          error={errors.amount}
        />

        {/* 3. النوع */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={labelStyle}>النوع</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
            {KINDS.map(k => {
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: active ? 700 : 500,
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-light)' : 'var(--bg-card)',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-family)',
                    minHeight: '40px',
                  }}
                >
                  {KIND_LABELS[k]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Partial amount — shown only when kind=partial */}
        {kind === 'partial' && (
          <Input
            label="المبلغ المدفوع"
            value={partialRaw}
            onChange={setPartialRaw}
            type="number"
            placeholder="0"
            prefix="د.إ"
            error={errors.partial}
          />
        )}

        {/* 5. التاريخ */}
        <Input
          label="التاريخ (اختياري)"
          value={dueDate}
          onChange={setDueDate}
          type="date"
        />

        {/* 6. صورة */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={labelStyle}>صورة (اختياري)</span>
          {imageData ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={imageData}
                alt="صورة مرفقة"
                style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={() => setImageData(undefined)}
                style={{
                  position: 'absolute',
                  top: 'var(--space-2)',
                  insetInlineEnd: 'var(--space-2)',
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontFamily: 'var(--font-family)',
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px dashed var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family)',
                width: '100%',
              }}
            >
              <span>إرفاق صورة</span>
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>

        {/* 7. ملاحظة */}
        <Input
          label="ملاحظة (اختياري)"
          value={notes}
          onChange={setNotes}
          placeholder="أي ملاحظات..."
          multiline
          rows={2}
        />

      </div>
    </BottomSheet>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

export default AddExpenseSheet;

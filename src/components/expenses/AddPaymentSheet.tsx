import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useApp } from '../../context/AppContext';
import * as db from '../../db/database';
import { formatCurrency, generateId, now, parseCurrencyInput } from '../../utils/formatting';
import type { ExpenseItem, TransactionType } from '../../types';

const KIND_LABELS: Record<TransactionType, string> = {
  scheduled: 'مجدول',
  partial: 'جزئي',
  paid: 'كامل',
};

const KINDS: TransactionType[] = ['scheduled', 'partial', 'paid'];

const MAX_IMAGES = 3;

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > height && width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      else if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

interface AddPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: ExpenseItem | null;
}

export function AddPaymentSheet({ isOpen, onClose, item }: AddPaymentSheetProps) {
  const { dispatch } = useApp();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [amountRaw, setAmountRaw] = useState('');
  const [kind, setKind] = useState<TransactionType>('scheduled');
  const [dueDate, setDueDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !item) return;
    setErrors({});
    if (item.paidAmount > 0) {
      setAmountRaw(String(item.paidAmount));
      setKind(item.status === 'paid' ? 'paid' : item.status === 'partial' ? 'partial' : 'scheduled');
    } else {
      setAmountRaw('');
      setKind('scheduled');
    }
    setDueDate(item.dueDate ?? '');
    setImages(item.images ?? (item.imageData ? [item.imageData] : []));
    setNotes('');
  }, [isOpen, item]);

  const amount = parseCurrencyInput(amountRaw);

  function handleKindChange(k: TransactionType) {
    setKind(k);
    if (k === 'paid' && !amountRaw && item?.expectedAmount) {
      setAmountRaw(String(item.expectedAmount));
    }
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (kind !== 'scheduled' && amount <= 0) errs.amount = 'أدخل المبلغ المدفوع';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || images.length >= MAX_IMAGES) return;
    e.target.value = '';
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return;
    if (file.size > MAX_IMAGE_BYTES) return;
    try {
      const compressed = await compressImage(file);
      setImages(prev => [...prev, compressed]);
    } catch {
      // ignore image errors
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!item || !validate()) return;
    setSaving(true);
    try {
      const paidAmount = kind === 'paid'
        ? (amount > 0 ? amount : item.expectedAmount)
        : kind === 'partial' ? amount : 0;
      const status = kind === 'paid' ? 'paid' as const
        : kind === 'partial' ? 'partial' as const
        : 'unpaid' as const;

      const updated: ExpenseItem = {
        ...item,
        paidAmount,
        status,
        dueDate: dueDate || undefined,
        images,
        imageData: undefined,
        notes: notes.trim() || item.notes || undefined,
        updatedAt: now(),
      };

      await db.saveExpense(updated);
      dispatch({ type: 'UPSERT_EXPENSE', payload: updated });

      if (paidAmount > 0 && paidAmount !== item.paidAmount) {
        const payEvent = {
          id: generateId(),
          type: 'payment_made' as const,
          title: `دفعت ${formatCurrency(paidAmount)} لـ "${item.name}"`,
          amount: paidAmount,
          categoryId: item.categoryId,
          expenseId: item.id,
          date: now(),
        };
        await db.addJourneyEvent(payEvent);
        dispatch({ type: 'ADD_JOURNEY', payload: payEvent });
      }

      onClose();
    } catch (err) {
      console.error('Failed to save payment:', err);
    } finally {
      setSaving(false);
    }
  }

  const canSave = kind === 'scheduled' || amount > 0;

  if (!item) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة دفعة"
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
          حفظ الدفعة
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {/* Item context */}
        <div style={{
          padding: 'var(--space-3)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          borderRight: '3px solid var(--accent)',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.04em' }}>
            وصف الدفعة
          </span>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
            {item.name}
          </p>
        </div>

        {/* Payment type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={labelStyle}>نوع الدفعة</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
            {KINDS.map(k => {
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKindChange(k)}
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

        {/* Amount — shown for paid/partial */}
        {kind !== 'scheduled' && (
          <Input
            label="المبلغ المدفوع"
            value={amountRaw}
            onChange={setAmountRaw}
            type="number"
            placeholder="0"
            prefix="د.إ"
            error={errors.amount}
          />
        )}

        {/* Date */}
        <Input
          label="التاريخ (اختياري)"
          value={dueDate}
          onChange={setDueDate}
          type="date"
        />

        {/* Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={labelStyle}>صور اختيارية</span>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
            تقدر تضيف حتى 3 صور للفاتورة أو الشي اللي اشتريته.
          </p>
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {images.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <img
                    src={src}
                    alt={`صورة ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: -6, insetInlineStart: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--danger)', border: 'none', color: 'white',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontFamily: 'var(--font-family)', lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < MAX_IMAGES ? (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)',
                border: '1.5px dashed var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--text-tertiary)', cursor: 'pointer',
                fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-family)', width: '100%',
              }}
            >
              <span>+ إضافة صورة</span>
            </button>
          ) : (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
              وصلت للحد الأقصى للصور.
            </p>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>

        {/* Notes */}
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

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

export default AddPaymentSheet;

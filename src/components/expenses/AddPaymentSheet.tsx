import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PlusIcon, CheckIcon } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import * as db from '../../db/database';
import { formatCurrency, generateId, now, parseCurrencyInput } from '../../utils/formatting';
import { isPositiveAmount, AMOUNT_POSITIVE_ERROR, getTodayDateInputValue } from '../../utils/validation';
import type { ExpenseItem } from '../../types';

type ItemStatus = 'paid' | 'partial' | 'planned';

const STATUS_OPTIONS: { key: ItemStatus; label: string; hint: string; dot: string }[] = [
  { key: 'paid',    label: 'تم الدفع',     hint: 'سدّدت كامل المبلغ',     dot: 'var(--success)' },
  { key: 'partial', label: 'دفعة جزئية',   hint: 'دفعت جزء وباقي عليك',  dot: 'var(--warning)' },
  { key: 'planned', label: 'مخطط له',      hint: 'بعدك ما دفعت',          dot: 'var(--text-tertiary)' },
];

const AMOUNT_LABELS: Record<ItemStatus, string> = {
  paid: 'المبلغ المدفوع',
  partial: 'كم دفعت؟',
  planned: 'المبلغ المتوقع',
};

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
  const [status, setStatus] = useState<ItemStatus>('planned');
  const [dueDate, setDueDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showImages, setShowImages] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !item) return;
    setErrors({});
    const initialStatus: ItemStatus =
      item.status === 'paid' ? 'paid' : item.status === 'partial' ? 'partial' : 'planned';
    setStatus(initialStatus);
    if (initialStatus === 'planned') {
      setAmountRaw(item.expectedAmount > 0 ? String(item.expectedAmount) : '');
    } else {
      setAmountRaw(item.paidAmount > 0 ? String(item.paidAmount) : '');
    }
    setDueDate(item.dueDate ?? '');
    const existingImages = item.images ?? (item.imageData ? [item.imageData] : []);
    setImages(existingImages);
    setShowImages(existingImages.length > 0);
    setNotes(item.notes ?? '');
    setShowNotes(!!item.notes);
  }, [isOpen, item]);

  const amount = parseCurrencyInput(amountRaw);

  function handleStatusChange(next: ItemStatus) {
    setStatus(next);
    // Helpful prefills: "paid" pre-loads the planned amount; "planned" shows the planned amount.
    if ((next === 'paid' && !amountRaw && item?.expectedAmount) || (next === 'planned' && !amountRaw && item?.expectedAmount)) {
      setAmountRaw(String(item.expectedAmount));
    }
    // Paid/partial default the date to today; planned keeps it optional.
    if ((next === 'paid' || next === 'partial') && !dueDate) {
      setDueDate(getTodayDateInputValue());
    }
    if (errors.amount) setErrors({});
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isPositiveAmount(amount)) errs.amount = AMOUNT_POSITIVE_ERROR;
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

  function openImages() {
    setShowImages(true);
    setTimeout(() => imageInputRef.current?.click(), 0);
  }

  async function handleSave() {
    if (!item || !validate()) return;
    setSaving(true);
    try {
      const paidAmount = status === 'paid' ? amount : status === 'partial' ? amount : 0;
      const nextStatus = status === 'paid' ? 'paid' as const
        : status === 'partial' ? 'partial' as const
        : 'unpaid' as const;
      // "مخطط له" lets the user set/adjust the planned cost of the item.
      const expectedAmount = status === 'planned' ? amount : item.expectedAmount;

      const updated: ExpenseItem = {
        ...item,
        expectedAmount,
        paidAmount,
        status: nextStatus,
        dueDate: dueDate || undefined,
        images,
        imageData: undefined,
        notes: notes.trim() || undefined,
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

  const canSave = isPositiveAmount(amount);

  if (!item) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="تحديث البند"
      footer={
        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={saving}
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          حفظ
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Item name context */}
        <p style={itemNameStyle}>{item.name}</p>

        {/* Status — the one decision the user makes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={questionStyle}>ما حالة هذا البند؟</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {STATUS_OPTIONS.map(opt => {
              const active = status === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleStatusChange(opt.key)}
                  style={statusCardStyle(active)}
                  aria-pressed={active}
                >
                  <span style={{ ...dotStyle, background: opt.dot }} aria-hidden="true" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={statusLabelStyle(active)}>{opt.label}</span>
                    <span style={statusHintStyle}>{opt.hint}</span>
                  </span>
                  {active && <CheckIcon size={18} color="var(--accent)" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <Input
          label={AMOUNT_LABELS[status]}
          value={amountRaw}
          onChange={setAmountRaw}
          type="number"
          placeholder="0"
          prefix="د.إ"
          error={errors.amount}
        />

        {/* Date */}
        <Input
          label={status === 'planned' ? 'موعد الدفع (اختياري)' : 'تاريخ الدفع'}
          value={dueDate}
          onChange={setDueDate}
          type="date"
        />

        {/* Optional extras — hidden behind small actions */}
        {(!showImages || !showNotes) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {!showImages && (
              <button type="button" style={ghostBtnStyle} onClick={openImages}>
                <PaperclipIcon />
                <span>إرفاق فاتورة أو صورة</span>
              </button>
            )}
            {!showNotes && (
              <button type="button" style={ghostBtnStyle} onClick={() => setShowNotes(true)}>
                <PlusIcon size={15} color="var(--text-secondary)" />
                <span>إضافة ملاحظة</span>
              </button>
            )}
          </div>
        )}

        {/* Images (revealed) */}
        {showImages && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={labelStyle}>إرفاق فاتورة أو صورة</span>
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
          </div>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />

        {/* Notes (revealed) */}
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

function PaperclipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

const itemNameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-size-md)',
  fontWeight: 800,
  color: 'var(--text-primary)',
};

const questionStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

function statusCardStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    minHeight: '52px',
    borderRadius: 'var(--radius-lg)',
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-light)' : 'var(--bg-card)',
    cursor: 'pointer',
    fontFamily: 'var(--font-family)',
    textAlign: 'start',
    width: '100%',
    transition: 'all var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };
}

const dotStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  flexShrink: 0,
};

function statusLabelStyle(active: boolean): React.CSSProperties {
  return {
    display: 'block',
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: active ? 'var(--accent)' : 'var(--text-primary)',
  };
}

const statusHintStyle: React.CSSProperties = {
  display: 'block',
  margin: '2px 0 0',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  lineHeight: 1.4,
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

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

export default AddPaymentSheet;

import React, { useState, useEffect, useRef } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PlusIcon } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import * as db from '../../db/database';
import { formatCurrency, generateId, now, parseCurrencyInput } from '../../utils/formatting';
import { isPositiveAmount, AMOUNT_POSITIVE_ERROR, getTodayDateInputValue } from '../../utils/validation';
import { deriveExpenseStatus } from '../../utils/calculations';
import type { ExpenseItem } from '../../types';

// The user answers one question — "شو صار؟" — and the app infers the status.
type PayMode = 'paid' | 'later';

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
  /** Which mode to open in. Quick Add opens on 'paid'. Defaults to 'paid'. */
  initialMode?: PayMode;
}

export function AddPaymentSheet({ isOpen, onClose, item, initialMode }: AddPaymentSheetProps) {
  const { dispatch } = useApp();
  const { show } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<PayMode>('paid');
  const [amountRaw, setAmountRaw] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showImages, setShowImages] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill the amount field for a given mode (paid total vs expected).
  function prefillFor(it: ExpenseItem, m: PayMode): string {
    if (m === 'later') return it.expectedAmount > 0 ? String(it.expectedAmount) : '';
    // 'paid': base on the existing total if any, else the planned cost (fast "paid in full").
    if (it.paidAmount > 0) return String(it.paidAmount);
    return it.expectedAmount > 0 ? String(it.expectedAmount) : '';
  }

  useEffect(() => {
    if (!isOpen || !item) return;
    setErrors({});
    const startMode: PayMode = initialMode ?? 'paid';
    setMode(startMode);
    setAmountRaw(prefillFor(item, startMode));
    setDueDate(item.dueDate ?? (startMode === 'paid' ? getTodayDateInputValue() : ''));
    const existingImages = item.images ?? (item.imageData ? [item.imageData] : []);
    setImages(existingImages);
    setShowImages(existingImages.length > 0);
    setNotes(item.notes ?? '');
    setShowNotes(!!item.notes);
  }, [isOpen, item, initialMode]);

  const amount = parseCurrencyInput(amountRaw);

  function handleModeChange(next: PayMode) {
    if (next === mode || !item) return;
    setMode(next);
    setAmountRaw(prefillFor(item, next));
    if (next === 'paid' && !dueDate) setDueDate(getTodayDateInputValue());
    setErrors({});
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
      let paidAmount: number;
      let expectedAmount: number;
      if (mode === 'paid') {
        paidAmount = amount;                                   // "كم دفعت؟" = total paid on the item
        expectedAmount = item.expectedAmount > 0 ? item.expectedAmount : amount; // record a plan if none existed
      } else {
        paidAmount = item.paidAmount;                          // "بدفعه لاحقاً" never resets an existing payment
        expectedAmount = amount;                               // "المبلغ المتوقع"
      }
      const status = deriveExpenseStatus(paidAmount, expectedAmount);

      const updated: ExpenseItem = {
        ...item,
        expectedAmount,
        paidAmount,
        status,
        dueDate: dueDate || undefined,
        images,
        imageData: undefined,
        notes: notes.trim() || undefined,
        updatedAt: now(),
      };

      await db.saveExpense(updated);
      dispatch({ type: 'UPSERT_EXPENSE', payload: updated });

      // Log a journey event only when an actual payment was recorded/changed.
      if (mode === 'paid' && paidAmount > 0 && paidAmount !== item.paidAmount) {
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

      show('تم الحفظ ✓');
      onClose();
    } catch (err) {
      console.error('Failed to save payment:', err);
    } finally {
      setSaving(false);
    }
  }

  const canSave = isPositiveAmount(amount);
  const paidHint = mode === 'paid' && item && item.paidAmount > 0
    ? `دفعت سابقاً: ${formatCurrency(item.paidAmount)} — اكتب الإجمالي بعد الدفعة`
    : undefined;

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

        {/* The one question */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={questionStyle}>شو صار؟</span>
          <div style={segStyle}>
            <button type="button" style={segBtnStyle(mode === 'paid')} onClick={() => handleModeChange('paid')} aria-pressed={mode === 'paid'}>
              دفعت مبلغ
            </button>
            <button type="button" style={segBtnStyle(mode === 'later')} onClick={() => handleModeChange('later')} aria-pressed={mode === 'later'}>
              بدفعه لاحقاً
            </button>
          </div>
        </div>

        {/* Amount — meaning depends on the mode */}
        <Input
          label={mode === 'paid' ? 'كم دفعت؟' : 'المبلغ المتوقع'}
          value={amountRaw}
          onChange={(v) => { setAmountRaw(v); if (errors.amount) setErrors({}); }}
          type="number"
          placeholder="0"
          prefix="د.إ"
          error={errors.amount}
          hint={paidHint}
        />

        {/* Date */}
        <Input
          label={mode === 'paid' ? 'متى دفعت؟' : 'موعد الدفع (اختياري)'}
          value={dueDate}
          onChange={setDueDate}
          type="date"
        />

        {/* Optional extras — only when recording a payment, hidden behind small actions */}
        {mode === 'paid' && (!showImages || !showNotes) && (
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
        {mode === 'paid' && showImages && (
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
        {mode === 'paid' && showNotes && (
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

const segStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-2)',
};

function segBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: 'var(--space-3) var(--space-2)',
    minHeight: '48px',
    borderRadius: 'var(--radius-lg)',
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-light)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size-base)',
    fontWeight: active ? 800 : 600,
    transition: 'all var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
  };
}

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

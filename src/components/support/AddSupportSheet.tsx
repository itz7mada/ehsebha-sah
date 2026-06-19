import React, { useEffect, useState } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PlusIcon } from '../common/Icons';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import * as db from '../../db/database';
import { generateId, now, parseCurrencyInput } from '../../utils/formatting';
import type { SupportItem } from '../../types';

interface AddSupportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: SupportItem | null;
}

/**
 * Quick support/contribution sheet. Shows only منو الداعم + المبلغ by default;
 * the note is hidden behind a small button. Used by the Support page and Quick Add.
 */
export function AddSupportSheet({ isOpen, onClose, editItem }: AddSupportSheetProps) {
  const { dispatch } = useApp();
  const { show } = useToast();

  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (editItem) {
      setName(editItem.name);
      setAmountRaw(String(editItem.amount));
      setNotes(editItem.notes ?? '');
      setShowNotes(!!editItem.notes);
    } else {
      setName('');
      setAmountRaw('');
      setNotes('');
      setShowNotes(false);
    }
  }, [isOpen, editItem]);

  const amount = parseCurrencyInput(amountRaw);
  const isValid = name.trim().length > 0 && amount > 0;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'اسم المساهم مطلوب';
    if (isNaN(amount) || amount <= 0) errs.amount = 'قيمة المساهمة مطلوبة وأكبر من صفر';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const isNew = !editItem;
      const item: SupportItem = {
        id: editItem?.id ?? generateId(),
        name: name.trim(),
        relation: editItem?.relation ?? '',
        amount,
        status: 'received',
        notes: notes.trim() || undefined,
        createdAt: editItem?.createdAt ?? now(),
        updatedAt: now(),
      };
      await db.saveSupport(item);
      dispatch({ type: 'UPSERT_SUPPORT', payload: item });

      if (isNew) {
        const ev = {
          id: generateId(),
          type: 'support_added' as const,
          title: `أضيفت مساهمة من ${item.name}`,
          amount: item.amount,
          date: now(),
        };
        await db.addJourneyEvent(ev);
        dispatch({ type: 'ADD_JOURNEY', payload: ev });
      }

      show('تم الحفظ ✓');
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? 'تعديل مساهمة' : 'إضافة مساهمة'}
      footer={
        <Button fullWidth variant="primary" size="xl" onClick={handleSave} loading={saving} disabled={!isValid || saving}>
          {editItem ? 'حفظ التعديلات' : 'حفظ'}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          label="منو المساهم؟"
          value={name}
          onChange={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: '' })); }}
          placeholder="مثال: الوالد"
          error={errors.name}
          autoFocus={!editItem}
        />
        <Input
          label="قيمة المساهمة"
          value={amountRaw}
          onChange={(v) => { setAmountRaw(v); if (errors.amount) setErrors((e) => ({ ...e, amount: '' })); }}
          type="number"
          prefix="د.إ"
          placeholder="0"
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
            placeholder="مثال: دفعة للمساعدة في السكن"
            multiline
            rows={2}
            autoFocus
          />
        )}
      </div>
    </BottomSheet>
  );
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

export default AddSupportSheet;

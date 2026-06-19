import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Input } from './Input';
import { useApp } from '../../context/AppContext';
import { useToast } from './Toast';
import * as db from '../../db/database';
import { parseCurrencyInput, formatCurrency, now, generateId } from '../../utils/formatting';
import { validateBudget } from '../../utils/validation';

interface EditBudgetSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Single-field quick budget editor. Reused by Quick Add (and reusable in Settings). */
export function EditBudgetSheet({ isOpen, onClose }: EditBudgetSheetProps) {
  const { state, dispatch } = useApp();
  const { show } = useToast();
  const settings = state.settings;

  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !settings) return;
    setRaw(settings.budget > 0 ? String(settings.budget) : '');
    setError('');
  }, [isOpen, settings]);

  const amount = parseCurrencyInput(raw);

  async function handleSave() {
    if (!settings) return;
    const err = validateBudget(amount);
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      const updated = { ...settings, budget: amount, updatedAt: now() };
      await db.saveSettings(updated);
      dispatch({ type: 'UPDATE_SETTINGS', payload: updated });
      if (amount !== settings.budget) {
        const ev = {
          id: generateId(),
          type: 'budget_updated' as const,
          title: `تم تحديث الميزانية إلى ${formatCurrency(amount)}`,
          amount,
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
      title="تعديل الميزانية"
      footer={
        <Button variant="primary" size="xl" fullWidth loading={saving} disabled={amount <= 0 || saving} onClick={handleSave}>
          حفظ
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Input
          label="الميزانية الجديدة"
          value={raw}
          onChange={(v) => { setRaw(v); if (error) setError(''); }}
          type="number"
          prefix="د.إ"
          placeholder="0"
          error={error}
          autoFocus
        />
        {amount > 0 && !error && (
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            الميزانية: <span className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(amount)}</span>
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

export default EditBudgetSheet;

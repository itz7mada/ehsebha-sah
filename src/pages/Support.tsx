import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import * as db from '../db/database';
import { formatCurrency, generateId, now, parseCurrencyInput } from '../utils/formatting';
import type { SupportItem } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { BottomSheet } from '../components/common/BottomSheet';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PlusIcon, TrashIcon, EditIcon } from '../components/common/Icons';

const emptyForm = { name: '', amount: '', notes: '' };

export default function Support() {
  const { state, dispatch } = useApp();
  const { support } = state;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SupportItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const total = support.reduce((s, i) => s + i.amount, 0);

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm });
    setErrors({});
    setSheetOpen(true);
  }

  function openEdit(item: SupportItem) {
    setEditing(item);
    setForm({ name: item.name, amount: String(item.amount), notes: item.notes || '' });
    setErrors({});
    setSheetOpen(true);
  }

  function isValid(): boolean {
    return form.name.trim().length > 0 && parseCurrencyInput(form.amount) > 0;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'الاسم أو المصدر مطلوب';
    const amt = parseCurrencyInput(form.amount);
    if (isNaN(amt) || amt <= 0) errs.amount = 'المبلغ مطلوب وأكبر من صفر';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const isNew = !editing;
      const item: SupportItem = {
        id: editing?.id ?? generateId(),
        name: form.name.trim(),
        relation: editing?.relation ?? '',
        amount: parseCurrencyInput(form.amount),
        status: 'received',
        notes: form.notes.trim() || undefined,
        createdAt: editing?.createdAt ?? now(),
        updatedAt: now(),
      };
      await db.saveSupport(item);
      dispatch({ type: 'UPSERT_SUPPORT', payload: item });

      if (isNew) {
        const journeyEvent = {
          id: generateId(),
          type: 'support_added' as const,
          title: `أضيفت مساهمة من ${item.name}`,
          amount: item.amount,
          date: now(),
        };
        await db.addJourneyEvent(journeyEvent);
        dispatch({ type: 'ADD_JOURNEY', payload: journeyEvent });
      }

      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await db.deleteSupport(id);
    dispatch({ type: 'DELETE_SUPPORT', payload: id });
    setDeleteTarget(null);
  }

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>المساهمات</h1>
          <p style={pageSubtitleStyle}>أي مبلغ يساعدك في خطة الزواج، خله واضح ومحسوب.</p>
        </div>
        {support.length > 0 && (
          <Button size="sm" onClick={openAdd} icon={<PlusIcon size={16} />}>
            إضافة
          </Button>
        )}
      </div>

      <div style={contentStyle}>
        {/* Summary card — only when there are contributions */}
        {total > 0 && (
          <div style={summaryCardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                إجمالي المساهمات
              </span>
              <span className="num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', lineHeight: 1.1 }}>
                {formatCurrency(total)}
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                هذا المبلغ يضاف على ميزانيتك المتاحة.
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {support.length === 0 ? (
          <div style={emptyStateStyle}>
            <span style={emptyTitleStyle}>لا توجد مساهمات بعد</span>
            <p style={emptyTextStyle}>
              إذا عندك أي مساهمة من الأهل أو غيرهم، تقدر تضيفها هنا عشان تنحسب ضمن خطتك.
            </p>
            <Button variant="primary" onClick={openAdd} icon={<PlusIcon size={16} />}>
              إضافة مساهمة
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {support.map(item => (
              <ContributionCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => setDeleteTarget(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'تعديل مساهمة' : 'إضافة مساهمة'}
        footer={
          <Button
            fullWidth
            onClick={handleSave}
            loading={saving}
            disabled={!isValid()}
            variant="primary"
            size="xl"
          >
            {editing ? 'حفظ التعديلات' : 'إضافة المساهمة'}
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="الاسم أو المصدر"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="مثال: الوالد"
            error={errors.name}
            autoFocus
          />
          <Input
            label="المبلغ"
            value={form.amount}
            onChange={v => setForm(f => ({ ...f, amount: v }))}
            type="number"
            prefix="د.إ"
            placeholder="0"
            error={errors.amount}
          />
          <Input
            label="ملاحظة اختيارية"
            value={form.notes}
            onChange={v => setForm(f => ({ ...f, notes: v }))}
            placeholder="مثال: دفعة للمساعدة في السكن"
            multiline
            rows={2}
          />
        </div>
      </BottomSheet>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="حذف المساهمة"
        message="هل تريد حذف هذه المساهمة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}

function ContributionCard({
  item,
  onEdit,
  onDelete,
}: {
  item: SupportItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>
          {item.name}
        </span>
        <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--success)' }}>
          {formatCurrency(item.amount)}
        </span>
        {item.notes && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            {item.notes}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onEdit}
          aria-label="تعديل"
          style={iconBtnStyle}
        >
          <EditIcon size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="حذف"
          style={{ ...iconBtnStyle, background: 'var(--danger-light)', color: 'var(--danger)' }}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--bg-primary)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  padding: 'var(--space-5)',
  paddingTop: 'var(--page-top)',
  background: 'var(--bg-card)',
  borderBottom: '1px solid var(--border-light)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-lg)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: 0,
  lineHeight: 1.2,
};

const pageSubtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  margin: '4px 0 0',
  lineHeight: 1.5,
};

const contentStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  maxWidth: '480px',
  margin: '0 auto',
  paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-6))',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const summaryCardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--border-light)',
  padding: 'var(--space-5)',
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-8) var(--space-4)',
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-md)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  lineHeight: 1.7,
  margin: 0,
  maxWidth: '280px',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--border-light)',
  padding: 'var(--space-4)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
};

const iconBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--bg-secondary)',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  transition: 'background var(--transition-fast)',
  flexShrink: 0,
};

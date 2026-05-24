import React, { useState } from 'react';
import Button from '../common/Button';
import { RELATION_OPTIONS } from '../../types';
import { parseCurrencyInput, formatCurrency } from '../../utils/formatting';

export interface SupportEntry {
  name: string;
  relation: string;
  amount: number;
  status: 'expected' | 'received';
}

interface Step5SupportProps {
  choice: 'yes' | 'later' | 'no';
  onChoiceChange: (c: 'yes' | 'later' | 'no') => void;
  items: SupportEntry[];
  onItemsChange: (items: SupportEntry[]) => void;
  onNext: () => void;
}

const CHOICES: { value: 'yes' | 'later' | 'no'; label: string; desc: string }[] = [
  { value: 'yes', label: 'عندي مساهمات', desc: 'دعم مالي من الأهل أو الأقارب' },
  { value: 'later', label: 'بضيفها لاحقاً', desc: 'أدخل التفاصيل بعدين' },
  { value: 'no', label: 'أعتمد على نفسي', desc: 'ميزانيتي بدون مساهمات' },
];

export default function Step5Support({ choice, onChoiceChange, items, onItemsChange, onNext }: Step5SupportProps) {
  const [form, setForm] = useState<SupportEntry>({ name: '', relation: RELATION_OPTIONS[0], amount: 0, status: 'expected' });
  const [amountRaw, setAmountRaw] = useState('');

  function handleAdd() {
    if (!form.name.trim() || form.amount <= 0) return;
    onItemsChange([...items, { ...form }]);
    setForm({ name: '', relation: RELATION_OPTIONS[0], amount: 0, status: 'expected' });
    setAmountRaw('');
  }

  function handleRemove(index: number) {
    onItemsChange(items.filter((_, i) => i !== index));
  }

  const canAdd = form.name.trim().length >= 2 && form.amount > 0;

  return (
    <div style={screen}>
      <div style={scroll}>
        <p style={stepLabel}>المساهمات</p>
        <h1 style={title}>عندك مساهمات؟</h1>
        <p style={subtitle}>أي دعم من الأهل أو غيرهم، خله محسوب ضمن خطتك.</p>

        <div style={optionsWrap}>
          {CHOICES.map((c) => {
            const active = choice === c.value;
            return (
              <button key={c.value} type="button" style={optionCard(active)} onClick={() => onChoiceChange(c.value)}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{c.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{c.desc}</p>
                </div>
                {active && <CheckMark />}
              </button>
            );
          })}
        </div>

        {choice === 'yes' && (
          <div style={formCard}>
            <p style={formTitle}>أضف الداعمين</p>

            <div style={fieldGroup}>
              <label style={fieldLabel}>الاسم</label>
              <input type="text" value={form.name} placeholder="مثال: الوالد" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={textInput} />
            </div>

            <div style={fieldGroup}>
              <label style={fieldLabel}>صلة القرابة</label>
              <select value={form.relation} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} style={selectInput}>
                {RELATION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={fieldGroup}>
              <label style={fieldLabel}>المبلغ</label>
              <div style={amtRow}>
                <span style={prefix}>د.إ</span>
                <input type="number" inputMode="numeric" value={amountRaw} min={0} placeholder="0" onChange={(e) => { setAmountRaw(e.target.value); setForm((f) => ({ ...f, amount: parseCurrencyInput(e.target.value) })); }} style={numInput} />
              </div>
            </div>

            <div style={fieldGroup}>
              <label style={fieldLabel}>الحالة</label>
              <div style={radioRow}>
                {(['expected', 'received'] as const).map((s) => (
                  <label key={s} style={radioLabel}>
                    <input type="radio" name="support-status" value={s} checked={form.status === s} onChange={() => setForm((f) => ({ ...f, status: s }))} style={{ accentColor: 'var(--accent)' }} />
                    {s === 'expected' ? 'متوقعة' : 'مستلمة'}
                  </label>
                ))}
              </div>
            </div>

            <button type="button" style={{ ...addBtn, opacity: canAdd ? 1 : 0.45 }} onClick={handleAdd} disabled={!canAdd}>
              إضافة +
            </button>

            {items.length > 0 && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {items.map((item, i) => (
                  <div key={i} style={itemRow}>
                    <div>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                        {item.relation} · {formatCurrency(item.amount)} · <span style={{ color: item.status === 'received' ? 'var(--success)' : 'var(--warning)' }}>{item.status === 'received' ? 'مستلمة' : 'متوقعة'}</span>
                      </p>
                    </div>
                    <button type="button" style={deleteBtn} onClick={() => handleRemove(i)} aria-label="حذف">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>التالي</Button>
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

const screen: React.CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' };
const scroll: React.CSSProperties = { flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-6) var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column' };
const footer: React.CSSProperties = { padding: 'var(--space-4) var(--space-6)', paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))', flexShrink: 0, borderTop: '1px solid var(--border-light)' };

const stepLabel: React.CSSProperties = { margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.8px' };
const title: React.CSSProperties = { margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 };
const subtitle: React.CSSProperties = { margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', lineHeight: 1.7 };

const optionsWrap: React.CSSProperties = { marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' };

function optionCard(active: boolean): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-xl)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-light)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'start', width: '100%', fontFamily: 'var(--font-family)', transition: 'all var(--transition-fast)', WebkitTapHighlightColor: 'transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
}

const formCard: React.CSSProperties = { marginTop: 'var(--space-4)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const formTitle: React.CSSProperties = { margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)' };
const fieldGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' };
const fieldLabel: React.CSSProperties = { fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' };

const sharedInput: React.CSSProperties = { background: 'var(--bg-primary)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', padding: 'var(--space-3) var(--space-4)', outline: 'none', width: '100%', boxSizing: 'border-box', direction: 'rtl' };
const textInput: React.CSSProperties = { ...sharedInput };
const selectInput: React.CSSProperties = { ...sharedInput, cursor: 'pointer' };

const amtRow: React.CSSProperties = { display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' };
const prefix: React.CSSProperties = { padding: '0 var(--space-3)', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', alignSelf: 'stretch', display: 'flex', alignItems: 'center', borderInlineEnd: '1px solid var(--border)', flexShrink: 0, fontSize: 'var(--font-size-base)' };
const numInput: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', padding: 'var(--space-3) var(--space-4)', direction: 'ltr', minWidth: 0 };

const radioRow: React.CSSProperties = { display: 'flex', gap: 'var(--space-5)', alignItems: 'center', padding: 'var(--space-2) 0' };
const radioLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', cursor: 'pointer' };

const addBtn: React.CSSProperties = { background: 'var(--accent)', color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-full)', padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--font-size-base)', fontWeight: 700, fontFamily: 'var(--font-family)', cursor: 'pointer', alignSelf: 'flex-start', transition: 'opacity var(--transition-fast)' };

const itemRow: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' };
const deleteBtn: React.CSSProperties = { background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 };

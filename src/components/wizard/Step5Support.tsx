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

const CHOICES: { value: 'yes' | 'later' | 'no'; label: string; emoji: string; desc: string }[] = [
  { value: 'yes', label: 'نعم، عندي معونة', emoji: '🤝', desc: 'دعم مالي من الأهل أو الأقارب' },
  { value: 'later', label: 'بعدين، سأضيفها لاحقًا', emoji: '⏰', desc: 'سأدخل التفاصيل لاحقًا' },
  { value: 'no', label: 'لا، اعتمد على نفسي', emoji: '💪', desc: 'ميزانيتي منفردة' },
];

export default function Step5Support({
  choice,
  onChoiceChange,
  items,
  onItemsChange,
  onNext,
}: Step5SupportProps) {
  const [form, setForm] = useState<SupportEntry>({
    name: '',
    relation: RELATION_OPTIONS[0],
    amount: 0,
    status: 'expected',
  });
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

  function handleAmountChange(raw: string) {
    setAmountRaw(raw);
    setForm((f) => ({ ...f, amount: parseCurrencyInput(raw) }));
  }

  const canAdd = form.name.trim().length >= 2 && form.amount > 0;

  return (
    <div style={containerStyle}>
      <div style={scrollAreaStyle}>
        <h1 style={titleStyle}>هل تتوقع معونة أو دعم من الأهل؟</h1>

        <div style={choicesGridStyle}>
          {CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              style={{
                ...choiceCardStyle,
                ...(choice === c.value ? choiceCardActiveStyle : {}),
              }}
              onClick={() => onChoiceChange(c.value)}
            >
              <span style={choiceEmojiStyle}>{c.emoji}</span>
              <span style={choiceLabelStyle}>{c.label}</span>
              <span style={choiceDescStyle}>{c.desc}</span>
            </button>
          ))}
        </div>

        {choice === 'yes' && (
          <div style={formSectionStyle}>
            <p style={formSectionTitleStyle}>أضف الداعمين</p>

            <div style={formGridStyle}>
              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>الاسم</label>
                <input
                  type="text"
                  value={form.name}
                  placeholder="مثال: الوالد"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={textInputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>صلة القرابة</label>
                <select
                  value={form.relation}
                  onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                  style={selectStyle}
                >
                  {RELATION_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>المبلغ</label>
                <div style={amountRowStyle}>
                  <span style={prefixStyle}>D</span>
                  <input
                    type="number"
                    value={amountRaw}
                    min={0}
                    placeholder="0"
                    onChange={(e) => handleAmountChange(e.target.value)}
                    style={amountInputStyle}
                  />
                </div>
              </div>

              <div style={fieldGroupStyle}>
                <label style={fieldLabelStyle}>الحالة</label>
                <div style={radioRowStyle}>
                  {(['expected', 'received'] as const).map((s) => (
                    <label key={s} style={radioLabelStyle}>
                      <input
                        type="radio"
                        name="support-status"
                        value={s}
                        checked={form.status === s}
                        onChange={() => setForm((f) => ({ ...f, status: s }))}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      {s === 'expected' ? 'متوقعة' : 'مستلمة'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              style={{ ...addBtnStyle, opacity: canAdd ? 1 : 0.5 }}
              onClick={handleAdd}
              disabled={!canAdd}
            >
              إضافة +
            </button>

            {items.length > 0 && (
              <div style={itemsListStyle}>
                {items.map((item, i) => (
                  <div key={i} style={itemRowStyle}>
                    <div style={itemInfoStyle}>
                      <span style={itemNameStyle}>{item.name}</span>
                      <span style={itemMetaStyle}>
                        {item.relation} · {formatCurrency(item.amount)}
                        {' · '}
                        <span style={{ color: item.status === 'received' ? 'var(--success)' : 'var(--warning)' }}>
                          {item.status === 'received' ? 'مستلمة' : 'متوقعة'}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      style={deleteBtnStyle}
                      onClick={() => handleRemove(i)}
                      aria-label="حذف"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          التالي →
        </Button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  paddingBottom: 'var(--space-4)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-6)',
  lineHeight: 1.4,
};

const choicesGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-6)',
};

const choiceCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 'var(--space-1)',
  padding: 'var(--space-4)',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  cursor: 'pointer',
  textAlign: 'right',
  transition: 'all var(--transition-fast)',
  width: '100%',
  fontFamily: 'var(--font-family)',
};

const choiceCardActiveStyle: React.CSSProperties = {
  background: 'var(--accent-light)',
  borderColor: 'var(--accent)',
};

const choiceEmojiStyle: React.CSSProperties = {
  fontSize: '24px',
  marginBottom: 'var(--space-1)',
};

const choiceLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const choiceDescStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
};

const formSectionStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const formSectionTitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: 0,
};

const formGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const sharedFieldStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family)',
  padding: 'var(--space-3) var(--space-4)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  direction: 'rtl',
};

const textInputStyle: React.CSSProperties = { ...sharedFieldStyle };

const selectStyle: React.CSSProperties = { ...sharedFieldStyle, cursor: 'pointer' };

const amountRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
};

const prefixStyle: React.CSSProperties = {
  padding: '0 var(--space-3)',
  fontWeight: 700,
  color: 'var(--accent)',
  background: 'var(--accent-light)',
  alignSelf: 'stretch',
  display: 'flex',
  alignItems: 'center',
  borderInlineEnd: '1px solid var(--border)',
  flexShrink: 0,
  fontSize: 'var(--font-size-base)',
};

const amountInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family)',
  padding: 'var(--space-3) var(--space-4)',
  direction: 'ltr',
  minWidth: 0,
};

const radioRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-5)',
  alignItems: 'center',
  padding: 'var(--space-2) 0',
};

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const addBtnStyle: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'var(--text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  padding: 'var(--space-3) var(--space-6)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  fontFamily: 'var(--font-family)',
  cursor: 'pointer',
  alignSelf: 'flex-start',
  transition: 'opacity var(--transition-fast)',
};

const itemsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-light)',
};

const itemInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const itemNameStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const itemMetaStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'var(--danger-light)',
  color: 'var(--danger)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  width: '28px',
  height: '28px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 700,
  flexShrink: 0,
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
  flexShrink: 0,
};

import React from 'react';
import Button from '../common/Button';
import { parseCurrencyInput, formatCurrency, normalizeDigits } from '../../utils/formatting';
import { validateBudget } from '../../utils/validation';

interface Step4BudgetProps {
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
}

export default function Step4Budget({ value, onChange, onNext }: Step4BudgetProps) {
  const [rawInput, setRawInput] = React.useState(value > 0 ? String(value) : '');
  const [focused, setFocused] = React.useState(false);

  function handleInputChange(raw: string) {
    const normalized = normalizeDigits(raw);
    setRawInput(normalized);
    onChange(parseCurrencyInput(normalized));
  }

  const error = validateBudget(value);
  const canProceed = error === null;
  // Only surface the error once the user has typed something invalid (e.g. 0).
  const showError = rawInput.trim() !== '' && !!error;
  const displayFormatted = value > 0 ? formatCurrency(value) : null;
  const borderColor = focused ? 'var(--accent)' : 'var(--border)';
  const ringColor = focused ? '0 0 0 3px var(--accent-light)' : '0 1px 3px rgba(0,0,0,0.05)';

  return (
    <div style={screen}>
      <div style={scroll}>
        <p style={stepLabel}>الميزانية</p>
        <h1 style={title}>كم ميزانيتك الإجمالية؟</h1>
        <p style={subtitle}>حط رقم تقريبي، مب لازم يكون دقيق من البداية.</p>

        <div style={card}>
          <label style={fieldLabel} htmlFor="w-budget">الميزانية الإجمالية</label>
          <div
            style={{
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: `1.5px solid ${borderColor}`,
              boxShadow: ringColor,
              overflow: 'hidden',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <span style={prefix}>د.إ</span>
            <input
              id="w-budget"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rawInput}
              placeholder="150000"
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={numInput}
            />
          </div>
          {displayFormatted && (
            <p style={previewText}>
              <span style={{ color: 'var(--text-tertiary)' }}>المبلغ: </span>
              <span className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{displayFormatted}</span>
            </p>
          )}
          {showError
            ? <p style={errorText}>{error}</p>
            : <p style={hint}>تقدر تعدلها لاحقاً من الإعدادات.</p>}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth disabled={!canProceed} onClick={onNext}>
          التالي
        </Button>
      </div>
    </div>
  );
}

const screen: React.CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' };
const scroll: React.CSSProperties = { flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-6) var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column' };
const footer: React.CSSProperties = { padding: 'var(--space-4) var(--space-6)', paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))', flexShrink: 0, borderTop: '1px solid var(--border-light)' };

const stepLabel: React.CSSProperties = { margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.8px' };
const title: React.CSSProperties = { margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 };
const subtitle: React.CSSProperties = { margin: 'var(--space-3) 0 0', fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', lineHeight: 1.7 };
const card: React.CSSProperties = { marginTop: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 'var(--space-6)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const fieldLabel: React.CSSProperties = { fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' };

const prefix: React.CSSProperties = { padding: '0 var(--space-3)', fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', alignSelf: 'stretch', display: 'flex', alignItems: 'center', borderInlineEnd: '1px solid var(--border)', flexShrink: 0, userSelect: 'none' };
const numInput: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)', padding: 'var(--space-3) var(--space-4)', direction: 'ltr', width: '100%' };
const previewText: React.CSSProperties = { margin: 'var(--space-3) 0 0', fontSize: 'var(--font-size-sm)' };
const hint: React.CSSProperties = { margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 };
const errorText: React.CSSProperties = { margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--danger)', fontWeight: 600, lineHeight: 1.5 };

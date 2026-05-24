import React, { useState } from 'react';
import Button from '../common/Button';
import { validateName } from '../../utils/validation';

interface Step1NameProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export default function Step1Name({ value, onChange, onNext }: Step1NameProps) {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  const error = touched ? validateName(value) ?? undefined : undefined;
  const canProceed = validateName(value) === null;

  function handleNext() {
    setTouched(true);
    if (canProceed) onNext();
  }

  const inputBorder = error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)';
  const inputRing = focused && !error ? '0 0 0 3px var(--accent-light)' : '0 1px 3px rgba(0,0,0,0.05)';

  return (
    <div style={screen}>
      <div style={scroll}>
        <p style={appMark}>احسبها صح</p>

        <div style={headingBlock}>
          <p style={stepLabel}>نبدأ بالحسبة</p>
          <h1 style={title}>شو اسمك؟</h1>
          <p style={subtitle}>خلنا نعرفك عشان نرتب لك التجربة باسمك.</p>
        </div>

        <div style={card}>
          <label style={fieldLabel} htmlFor="w-name">اسمك</label>
          <div
            style={{
              marginTop: '6px',
              borderRadius: 'var(--radius-lg)',
              border: `1.5px solid ${inputBorder}`,
              boxShadow: inputRing,
              background: 'var(--bg-primary)',
              overflow: 'hidden',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
          >
            <input
              id="w-name"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="اكتب اسمك"
              autoFocus
              style={inputEl}
            />
          </div>
          {error && <p style={errorMsg}>{error}</p>}
        </div>

        <p style={reassurance}>ما يحتاج تسجيل دخول. كل شيء محفوظ على جهازك.</p>
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth disabled={!canProceed} onClick={handleNext}>
          يلا نبدأ
        </Button>
      </div>
    </div>
  );
}

const screen: React.CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' };
const scroll: React.CSSProperties = { flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-6) var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column' };
const footer: React.CSSProperties = { padding: 'var(--space-4) var(--space-6)', paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))', flexShrink: 0, borderTop: '1px solid var(--border-light)' };

const appMark: React.CSSProperties = { margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px', textAlign: 'center' };
const headingBlock: React.CSSProperties = { marginTop: 'var(--space-8)' };
const stepLabel: React.CSSProperties = { margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.8px' };
const title: React.CSSProperties = { margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 };
const subtitle: React.CSSProperties = { margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', lineHeight: 1.7 };
const card: React.CSSProperties = { marginTop: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: 'var(--space-5)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const fieldLabel: React.CSSProperties = { fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' };
const inputEl: React.CSSProperties = { display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-family)', padding: 'var(--space-3) var(--space-4)', boxSizing: 'border-box', direction: 'rtl' };
const errorMsg: React.CSSProperties = { margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--danger)', fontWeight: 500 };
const reassurance: React.CSSProperties = { margin: 'var(--space-5) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.6, textAlign: 'center' };

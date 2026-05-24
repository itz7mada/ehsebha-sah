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

  const borderColor = error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)';
  const boxShadow = focused && !error
    ? '0 0 0 3px var(--accent-light)'
    : 'var(--shadow-sm)';

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={markWrapStyle}>
          <svg width="76" height="76" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <circle cx="40" cy="40" r="38" fill="var(--accent-light)" />
            <circle cx="40" cy="40" r="27" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.45" />
            <path
              d="M40,22 L43.4,31.7 L52.7,27.3 L48.3,36.6 L58,40 L48.3,43.4 L52.7,52.7 L43.4,48.3 L40,58 L36.6,48.3 L27.3,52.7 L31.7,43.4 L22,40 L31.7,36.6 L27.3,27.3 L36.6,31.7 Z"
              fill="var(--accent)" fillOpacity="0.18" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"
            />
            <circle cx="40" cy="40" r="4.5" fill="var(--accent)" />
          </svg>
        </div>

        <h1 style={titleStyle}>شو اسمك؟</h1>
        <p style={subtitleStyle}>خلنا نعرفك عشان نرتب لك التجربة.</p>

        <div style={inputWrapStyle}>
          <label style={labelStyle} htmlFor="wizard-name">اسمك</label>
          <div style={{ ...fieldRowStyle, border: `1.5px solid ${borderColor}`, boxShadow }}>
            <input
              id="wizard-name"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="اكتب اسمك"
              autoFocus
              style={inputStyle}
            />
          </div>
          {error && <span style={errorStyle}>{error}</span>}
        </div>
      </div>

      <div style={footerStyle}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canProceed}
          onClick={handleNext}
        >
          يلا نبدأ
        </Button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'space-between',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 'var(--space-6)',
};

const markWrapStyle: React.CSSProperties = {
  marginBottom: '28px',
  lineHeight: 0,
  filter: 'drop-shadow(0 4px 12px rgba(201,147,104,0.18))',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-3xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-2)',
  textAlign: 'center',
  lineHeight: 1.2,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-8)',
  textAlign: 'center',
  lineHeight: 1.6,
};

const inputWrapStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const fieldRowStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  overflow: 'hidden',
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family)',
  padding: 'var(--space-3) var(--space-4)',
  boxSizing: 'border-box',
  direction: 'rtl',
};

const errorStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--danger)',
  fontWeight: 500,
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
};

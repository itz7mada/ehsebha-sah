import React from 'react';
import Button from '../common/Button';
import { CalendarIcon } from '../common/Icons';
import { validateWeddingDate } from '../../utils/validation';

interface Step3DateProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export default function Step3Date({ value, onChange, onNext }: Step3DateProps) {
  const today = new Date().toISOString().split('T')[0];
  const canProceed = validateWeddingDate(value) === null;

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={decorStyle}>
          <CalendarIcon size={48} color="var(--accent)" />
        </div>
        <h1 style={titleStyle}>متى موعد الزواج؟</h1>
        <p style={subtitleStyle}>عشان نحسب لك الأيام المتبقية.</p>

        <div style={inputBlockStyle}>
          <label style={labelStyle} htmlFor="wedding-date">
            تاريخ الزواج
          </label>
          <div style={dateWrapStyle}>
            <span style={calIconStyle}>
              <CalendarIcon size={18} color="var(--accent)" />
            </span>
            <input
              id="wedding-date"
              type="date"
              value={value}
              min={today}
              onChange={(e) => onChange(e.target.value)}
              style={dateInputStyle}
            />
          </div>
        </div>

        <p style={hintStyle}>تقدر تعدله لاحقاً.</p>
      </div>

      <div style={footerStyle}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canProceed}
          onClick={onNext}
        >
          التالي
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
  paddingTop: 'var(--space-8)',
};

const decorStyle: React.CSSProperties = {
  marginBottom: 'var(--space-5)',
  lineHeight: 0,
  opacity: 0.85,
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-2xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-2)',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-8)',
  textAlign: 'center',
};

const inputBlockStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
  marginBottom: 'var(--space-4)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const dateWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
};

const calIconStyle: React.CSSProperties = {
  padding: '0 var(--space-3)',
  background: 'var(--accent-light)',
  alignSelf: 'stretch',
  display: 'flex',
  alignItems: 'center',
  borderInlineEnd: '1px solid var(--border)',
  flexShrink: 0,
};

const dateInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '16px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family)',
  padding: 'var(--space-3) var(--space-4)',
  direction: 'ltr',
  cursor: 'pointer',
  width: '100%',
};

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  textAlign: 'center',
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
};

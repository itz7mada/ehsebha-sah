import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { validateName } from '../../utils/validation';

interface Step1NameProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export default function Step1Name({ value, onChange, onNext }: Step1NameProps) {
  const [touched, setTouched] = useState(false);
  const error = touched ? validateName(value) ?? undefined : undefined;
  const canProceed = validateName(value) === null;

  function handleNext() {
    setTouched(true);
    if (canProceed) onNext();
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={decorStyle}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="var(--accent-light)" />
            <circle cx="32" cy="32" r="21" stroke="var(--accent)" strokeWidth="5" fill="none" />
            <circle cx="32" cy="32" r="12" fill="var(--accent)" fillOpacity="0.18" />
          </svg>
        </div>
        <h1 style={titleStyle}>شو اسمك؟</h1>
        <p style={subtitleStyle}>خلنا نعرفك عشان نرتب لك التجربة.</p>

        <div style={inputWrapStyle}>
          <Input
            value={value}
            onChange={onChange}
            placeholder="اكتب اسمك"
            autoFocus
            error={error}
          />
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
  paddingTop: 'var(--space-8)',
};

const decorStyle: React.CSSProperties = {
  marginBottom: 'var(--space-6)',
  lineHeight: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-3xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-2)',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-md)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-8)',
  textAlign: 'center',
};

const inputWrapStyle: React.CSSProperties = {
  width: '100%',
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
};

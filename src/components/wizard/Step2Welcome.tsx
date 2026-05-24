import React from 'react';
import Button from '../common/Button';
import { CheckIcon } from '../common/Icons';

interface Step2WelcomeProps {
  name: string;
  onNext: () => void;
}

const checkpoints = [
  'خطة مالية واضحة',
  'كل بياناتك على جهازك',
  'بدون تسجيل أو اشتراك',
];

export default function Step2Welcome({ name, onNext }: Step2WelcomeProps) {
  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={greetingWrapStyle}>
          <h1 style={greetingStyle}>
            الله حيّه يا{' '}
            <span style={nameStyle}>{name}</span>!
          </h1>
        </div>

        <p style={descStyle}>
          بنرتب رحلة الزواج خطوة بخطوة، بدون تعقيد وبدون صداع.
        </p>

        <div style={listWrapStyle}>
          {checkpoints.map((text) => (
            <div key={text} style={checkRowStyle}>
              <span style={checkIconStyle}><CheckIcon size={14} color="var(--text-inverse)" /></span>
              <span style={checkTextStyle}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={footerStyle}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onNext}
        >
          نرتبها
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
  justifyContent: 'center',
  paddingTop: 'var(--space-8)',
};

const greetingWrapStyle: React.CSSProperties = {
  marginBottom: 'var(--space-5)',
};

const greetingStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-2xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.4,
  margin: 0,
};

const nameStyle: React.CSSProperties = {
  color: 'var(--accent)',
};

const descStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-secondary)',
  lineHeight: 1.7,
  marginBottom: 'var(--space-8)',
};

const listWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const checkRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  background: 'var(--accent-light)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-light)',
};

const checkIconStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent)',
  color: 'var(--text-inverse)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  flexShrink: 0,
};

const checkTextStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
};

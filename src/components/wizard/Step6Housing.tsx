import React from 'react';
import Button from '../common/Button';
import type { HousingSituation } from '../../types';

const OPTIONS: { value: HousingSituation; label: string; emoji: string; subtitle: string }[] = [
  { value: 'family', label: 'بيت الأهل', emoji: '🏡', subtitle: 'السكن مع الأهل مؤقتًا' },
  { value: 'rent', label: 'إيجار', emoji: '🏢', subtitle: 'استئجار شقة أو وحدة سكنية' },
  { value: 'villa', label: 'فيلا', emoji: '🏠', subtitle: 'امتلاك أو إيجار فيلا' },
  { value: 'undecided', label: 'بعدني ما قررت', emoji: '🤔', subtitle: 'سيُحدد لاحقًا' },
];

interface Step6HousingProps {
  value: HousingSituation | undefined;
  onChange: (v: HousingSituation) => void;
  onNext: () => void;
}

export default function Step6Housing({ value, onChange, onNext }: Step6HousingProps) {
  return (
    <div style={containerStyle}>
      <div style={scrollAreaStyle}>
        <h1 style={titleStyle}>وين بتسكن بعد الزواج؟</h1>
        <p style={subtitleStyle}>يساعدنا في تنظيم الأقسام المناسبة لك</p>

        <div style={optionsStyle}>
          {OPTIONS.map(opt => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                style={{
                  ...optionStyle,
                  ...(selected ? optionSelectedStyle : optionDefaultStyle),
                }}
                onClick={() => onChange(opt.value)}
                aria-pressed={selected}
              >
                <span style={optionEmojiStyle}>{opt.emoji}</span>
                <div style={optionTextStyle}>
                  <span style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    color: selected ? 'var(--accent)' : 'var(--text-primary)',
                  }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    {opt.subtitle}
                  </span>
                </div>
                {selected && <span style={checkStyle}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={footerStyle}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onNext}
        >
          التالي
        </Button>
        {!value && (
          <button type="button" style={skipStyle} onClick={onNext}>
            تخطى
          </button>
        )}
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
  marginBottom: 'var(--space-2)',
  lineHeight: 1.4,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-6)',
};

const optionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const optionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-xl)',
  border: '2px solid',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  fontFamily: 'var(--font-family)',
  textAlign: 'start',
  width: '100%',
  WebkitTapHighlightColor: 'transparent',
};

const optionSelectedStyle: React.CSSProperties = {
  background: 'var(--accent-light)',
  borderColor: 'var(--accent)',
  boxShadow: '0 0 0 1px var(--accent)',
};

const optionDefaultStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderColor: 'var(--border)',
  boxShadow: 'var(--shadow-sm)',
};

const optionEmojiStyle: React.CSSProperties = {
  fontSize: '28px',
  lineHeight: 1,
  flexShrink: 0,
};

const optionTextStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const checkStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent)',
  color: 'var(--text-inverse)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 800,
  flexShrink: 0,
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const skipStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-family)',
  textAlign: 'center',
  padding: 'var(--space-2)',
};

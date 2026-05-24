import React from 'react';
import Button from '../common/Button';

interface Step2WelcomeProps {
  name: string;
  onNext: () => void;
}

const checkpoints = [
  { text: 'خطة مالية واضحة', sub: 'توزيع الميزانية على كل بند' },
  { text: 'بياناتك على جهازك فقط', sub: 'لا خوادم، لا سحاب، لا مشاركة' },
  { text: 'بدون تسجيل أو اشتراك', sub: 'مجاني تماماً، من أول يوم' },
];

export default function Step2Welcome({ name, onNext }: Step2WelcomeProps) {
  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={greetingBlockStyle}>
          <p style={welcomeTagStyle}>أهلاً وسهلاً</p>
          <h1 style={greetingStyle}>
            الله حيّه يا{' '}
            <span style={nameStyle}>{name}</span>!
          </h1>
          <p style={descStyle}>
            بنرتب رحلة الزواج خطوة بخطوة، بدون تعقيد وبدون صداع.
          </p>
        </div>

        <div style={listStyle}>
          {checkpoints.map((item, i) => (
            <div key={i} style={{ ...rowStyle, borderBottom: i < checkpoints.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <span style={dotStyle} />
              <div style={rowTextStyle}>
                <span style={rowLabelStyle}>{item.text}</span>
                <span style={rowSubStyle}>{item.sub}</span>
              </div>
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
  paddingTop: 'var(--space-6)',
  gap: 'var(--space-8)',
};

const greetingBlockStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const welcomeTagStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--accent)',
  letterSpacing: '0.5px',
  margin: 0,
};

const greetingStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-2xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.3,
  margin: 0,
};

const nameStyle: React.CSSProperties = {
  color: 'var(--accent)',
};

const descStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-secondary)',
  lineHeight: 1.7,
  margin: 0,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  borderRadius: 'var(--radius-xl)',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  overflow: 'hidden',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-4)',
  padding: 'var(--space-4) var(--space-5)',
};

const dotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent)',
  flexShrink: 0,
  marginTop: '5px',
};

const rowTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const rowSubStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  lineHeight: 1.5,
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
};

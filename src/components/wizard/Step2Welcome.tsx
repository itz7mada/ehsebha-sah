import React from 'react';
import Button from '../common/Button';

interface Step2WelcomeProps {
  name: string;
  onNext: () => void;
}

const rows = [
  { label: 'خطة مالية واضحة', sub: 'نرتب البنود والمبالغ بطريقة بسيطة.' },
  { label: 'بياناتك عندك', sub: 'ما نرفع معلوماتك لأي خادم.' },
  { label: 'بدون تسجيل أو اشتراك', sub: 'مجاني من أول يوم.' },
];

export default function Step2Welcome({ name, onNext }: Step2WelcomeProps) {
  return (
    <div style={screen}>
      <div style={scroll}>
        <p style={stepLabel}>أهلاً وسهلاً</p>
        <h1 style={title}>
          الله حيّه يا{' '}
          <span style={{ color: 'var(--accent)' }}>{name}</span>
        </h1>
        <p style={subtitle}>بنرتب رحلة الزواج خطوة بخطوة، بدون تعقيد وبدون صداع.</p>

        <div style={card}>
          {rows.map((row, i) => (
            <div
              key={i}
              style={{
                ...rowStyle,
                borderBottom: i < rows.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <span style={dot} />
              <div>
                <p style={rowLabel}>{row.label}</p>
                <p style={rowSub}>{row.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          نرتبها
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
const card: React.CSSProperties = { marginTop: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };

const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)' };
const dot: React.CSSProperties = { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '5px' };
const rowLabel: React.CSSProperties = { margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-primary)' };
const rowSub: React.CSSProperties = { margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 };

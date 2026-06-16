import React from 'react';
import Button from '../common/Button';
import type { UserRole } from '../../types';

interface StepRoleProps {
  value: string;
  onChange: (v: UserRole) => void;
  onNext: () => void;
}

const OPTIONS: { role: UserRole; label: string; hint: string }[] = [
  { role: 'groom', label: 'المعرس', hint: 'أرتّب حسبة الزواج من طرفي' },
  { role: 'bride', label: 'العروس', hint: 'أرتّب تجهيزاتي بوضوح' },
  { role: 'couple', label: 'نخطط مع بعض', hint: 'نرتّب الخطة سوا خطوة بخطوة' },
  { role: 'general', label: 'أفضّل أخليه عام', hint: 'بدون تحديد، تجربة عامة' },
];

export default function StepRole({ value, onChange, onNext }: StepRoleProps) {
  function handleNext() {
    // Never force a choice — default to the neutral "general" experience.
    if (!value) onChange('general');
    onNext();
  }

  return (
    <div style={screen}>
      <div style={scroll}>
        <p style={appMark}>احسبها صح</p>

        <div style={headingBlock}>
          <p style={stepLabel}>قبل ما نبدأ</p>
          <h1 style={title}>خلنا نضبط التجربة لك</h1>
          <p style={subtitle}>اختر الطريقة الأقرب لك، وتقدر تغيرها لاحقاً.</p>
        </div>

        <p style={question}>بتستخدم التطبيق كـ…</p>

        <div style={list}>
          {OPTIONS.map((opt) => {
            const selected = value === opt.role;
            return (
              <button
                key={opt.role}
                type="button"
                style={optionCard(selected)}
                onClick={() => onChange(opt.role)}
                aria-pressed={selected}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={optionLabel(selected)}>{opt.label}</span>
                  <span style={optionHint}>{opt.hint}</span>
                </span>
                <span style={radio(selected)} aria-hidden="true">
                  {selected && (
                    <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
          التالي
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
const title: React.CSSProperties = { margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 };
const subtitle: React.CSSProperties = { margin: 'var(--space-3) 0 0', fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', lineHeight: 1.7 };
const question: React.CSSProperties = { margin: 'var(--space-6) 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-secondary)' };

const list: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' };

function optionCard(selected: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-4) var(--space-5)',
    borderRadius: 'var(--radius-xl)',
    border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
    background: selected ? 'var(--accent-light)' : 'var(--bg-card)',
    cursor: 'pointer',
    fontFamily: 'var(--font-family)',
    textAlign: 'start',
    width: '100%',
    minHeight: '64px',
    transition: 'all var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };
}

function optionLabel(selected: boolean): React.CSSProperties {
  return { display: 'block', fontSize: 'var(--font-size-base)', fontWeight: 700, color: selected ? 'var(--accent)' : 'var(--text-primary)' };
}
const optionHint: React.CSSProperties = { display: 'block', margin: '3px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 };

function radio(selected: boolean): React.CSSProperties {
  return {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    flexShrink: 0,
    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
    background: selected ? 'var(--accent)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  };
}

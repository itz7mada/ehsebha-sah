import React from 'react';
import Button from '../common/Button';
import type { HousingSituation } from '../../types';

const OPTIONS: { value: HousingSituation; label: string; desc: string }[] = [
  { value: 'family', label: 'بيت الأهل', desc: 'السكن مع الأهل مؤقتاً' },
  { value: 'rent', label: 'إيجار', desc: 'شقة أو وحدة سكنية' },
  { value: 'villa', label: 'فيلا / بيت مستقل', desc: 'امتلاك أو إيجار فيلا' },
  { value: 'undecided', label: 'بعدني ما قررت', desc: 'يمكن تحديده لاحقاً' },
];

interface Step6HousingProps {
  value: HousingSituation | undefined;
  onChange: (v: HousingSituation) => void;
  onNext: () => void;
}

export default function Step6Housing({ value, onChange, onNext }: Step6HousingProps) {
  return (
    <div style={screen}>
      <div style={scroll}>
        <p style={stepLabel}>السكن</p>
        <h1 style={title}>وين بتسكن بعد الزواج؟</h1>
        <p style={subtitle}>عشان نرتب لك البنود المناسبة.</p>

        <div style={optionsWrap}>
          {OPTIONS.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                style={optionCard(selected)}
                onClick={() => onChange(opt.value)}
                aria-pressed={selected}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 700, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>{opt.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{opt.desc}</p>
                </div>
                {selected && <CheckMark />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          التالي
        </Button>
        {!value && (
          <button type="button" style={skipBtn} onClick={onNext}>تخطى</button>
        )}
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

const screen: React.CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' };
const scroll: React.CSSProperties = { flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-6) var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column' };
const footer: React.CSSProperties = { padding: 'var(--space-4) var(--space-6)', paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))', flexShrink: 0, borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' };

const stepLabel: React.CSSProperties = { margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.8px' };
const title: React.CSSProperties = { margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 };
const subtitle: React.CSSProperties = { margin: 'var(--space-3) 0 0', fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)', lineHeight: 1.7 };

const optionsWrap: React.CSSProperties = { marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' };

function optionCard(selected: boolean): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-xl)', border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, background: selected ? 'var(--accent-light)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'start', width: '100%', fontFamily: 'var(--font-family)', transition: 'all var(--transition-fast)', WebkitTapHighlightColor: 'transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
}

const skipBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-family)', textAlign: 'center', padding: 'var(--space-2)', width: '100%' };

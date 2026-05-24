import React from 'react';
import Button from '../common/Button';
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
    <div style={screen}>
      <div style={scroll}>
        <p style={stepLabel}>الموعد</p>
        <h1 style={title}>متى موعد الزواج؟</h1>
        <p style={subtitle}>عشان نحسب لك الأيام المتبقية ونرتب الخطة على راحتك.</p>

        <div style={card}>
          <label style={fieldLabel} htmlFor="w-date">تاريخ الزواج</label>
          <div style={dateWrap}>
            <input
              id="w-date"
              type="date"
              value={value}
              min={today}
              onChange={(e) => onChange(e.target.value)}
              style={dateInput}
            />
            <span style={calIconStyle} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
          </div>
          <p style={hint}>تقدر تعدله لاحقاً.</p>
        </div>

        <div style={{ flex: 1 }} />
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth disabled={!canProceed} onClick={onNext}>
          التالي
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
const card: React.CSSProperties = { marginTop: 'var(--space-6)', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: 'var(--space-6)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const fieldLabel: React.CSSProperties = { fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' };
const dateWrap: React.CSSProperties = { position: 'relative', marginTop: '6px', display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' };
const dateInput: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', padding: 'var(--space-3) 44px var(--space-3) var(--space-4)', direction: 'ltr', cursor: 'pointer', width: '100%', minWidth: 0 };
const calIconStyle: React.CSSProperties = { position: 'absolute', right: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 };
const hint: React.CSSProperties = { margin: 'var(--space-3) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 };

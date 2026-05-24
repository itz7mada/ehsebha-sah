import React from 'react';
import Button from '../common/Button';
import { DEFAULT_CATEGORIES } from '../../types';

interface Step6CategoriesProps {
  selected: string[];
  onToggle: (name: string) => void;
  onComplete: () => void;
  loading?: boolean;
}

export default function Step6Categories({ selected, onToggle, onComplete, loading = false }: Step6CategoriesProps) {
  return (
    <div style={screen}>
      <div style={scroll}>
        <p style={stepLabel}>خطة الزواج</p>
        <h1 style={title}>شو تبغي نرتب في خطتك؟</h1>
        <p style={subtitle}>اختار اللي يناسبك، وتقدر تضيف أو تحذف لاحقاً.</p>

        <div style={grid}>
          {DEFAULT_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.name);
            return (
              <button
                key={cat.name}
                type="button"
                style={catCard(isSelected)}
                onClick={() => onToggle(cat.name)}
                aria-pressed={isSelected}
              >
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--text-primary)', textAlign: 'center', lineHeight: 1.4 }}>
                  {cat.name}
                </span>
                {isSelected && (
                  <span style={checkBadge}>
                    <svg width="8" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p style={countNote}>
          {selected.length === 0
            ? 'لم تختر أي شيء بعد'
            : `اخترت ${selected.length} من ${DEFAULT_CATEGORIES.length}`}
        </p>
      </div>

      <div style={footer}>
        <Button variant="primary" size="lg" fullWidth loading={loading} disabled={loading} onClick={onComplete}>
          {loading ? '' : 'ابدأ الخطة'}
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

const grid: React.CSSProperties = { marginTop: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' };

function catCard(isSelected: boolean): React.CSSProperties {
  return { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5) var(--space-3)', borderRadius: 'var(--radius-xl)', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent-light)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all var(--transition-fast)', fontFamily: 'var(--font-family)', minHeight: '72px', WebkitTapHighlightColor: 'transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
}

const checkBadge: React.CSSProperties = { position: 'absolute', top: '8px', insetInlineEnd: '8px', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const countNote: React.CSSProperties = { margin: 'var(--space-4) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textAlign: 'center' };

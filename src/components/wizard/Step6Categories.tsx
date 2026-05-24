import React from 'react';
import Button from '../common/Button';
import { GridIcon } from '../common/Icons';
import { DEFAULT_CATEGORIES } from '../../types';

interface Step6CategoriesProps {
  selected: string[];
  onToggle: (name: string) => void;
  onComplete: () => void;
  loading?: boolean;
}

export default function Step6Categories({
  selected,
  onToggle,
  onComplete,
  loading = false,
}: Step6CategoriesProps) {
  return (
    <div style={containerStyle}>
      <div style={scrollAreaStyle}>
        <span style={iconRingStyle}>
          <GridIcon size={26} color="var(--accent)" />
        </span>
        <h1 style={titleStyle}>شو تبغي نرتب في خطتك؟</h1>
        <p style={subtitleStyle}>اختار اللي يناسبك، وتقدر تضيف أو تحذف لاحقاً.</p>

        <div style={gridStyle}>
          {DEFAULT_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.name);
            return (
              <button
                key={cat.name}
                type="button"
                style={{
                  ...cardStyle,
                  ...(isSelected ? cardActiveStyle : cardInactiveStyle),
                }}
                onClick={() => onToggle(cat.name)}
                aria-pressed={isSelected}
              >
                <span style={emojiStyle}>{cat.emoji}</span>
                <span style={{
                  ...cardLabelStyle,
                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                }}>
                  {cat.name}
                </span>
                {isSelected && (
                  <span style={checkBadgeStyle}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        <p style={selectedCountStyle}>
          {selected.length === 0
            ? 'لم تختر أي شيء بعد'
            : `اخترت ${selected.length} من ${DEFAULT_CATEGORIES.length}`}
        </p>
      </div>

      <div style={footerStyle}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
          onClick={onComplete}
        >
          {loading ? '' : 'ابدأ الخطة'}
        </Button>
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

const iconRingStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '60px',
  height: '60px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent-light)',
  boxShadow: '0 4px 12px rgba(201,147,104,0.18)',
  marginBottom: 'var(--space-4)',
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-4)',
};

const cardStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-5) var(--space-3)',
  borderRadius: 'var(--radius-xl)',
  border: '2px solid',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  fontFamily: 'var(--font-family)',
  minHeight: '96px',
  WebkitTapHighlightColor: 'transparent',
};

const cardActiveStyle: React.CSSProperties = {
  background: 'var(--accent-light)',
  borderColor: 'var(--accent)',
  boxShadow: '0 0 0 1px var(--accent)',
};

const cardInactiveStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderColor: 'var(--border)',
  boxShadow: 'var(--shadow-sm)',
};

const emojiStyle: React.CSSProperties = {
  fontSize: '32px',
  lineHeight: 1,
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  textAlign: 'center',
  transition: 'color var(--transition-fast)',
};

const checkBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'var(--space-2)',
  insetInlineEnd: 'var(--space-2)',
  width: '20px',
  height: '20px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent)',
  color: 'var(--text-inverse)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 800,
};

const selectedCountStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  textAlign: 'center',
  marginTop: 'var(--space-2)',
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
  flexShrink: 0,
};

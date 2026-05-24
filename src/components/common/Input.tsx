import React from 'react';
import { normalizeDigits } from '../../utils/formatting';

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'tel' | 'date';
  error?: string;
  prefix?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  hint?: string;
  multiline?: boolean;
  rows?: number;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  prefix,
  disabled = false,
  autoFocus = false,
  hint,
  multiline = false,
  rows = 3,
}: InputProps) {
  const [focused, setFocused] = React.useState(false);
  const inputId = React.useId();

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--text-secondary)',
    transition: 'color var(--transition-fast)',
  };

  const fieldRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: multiline ? 'flex-start' : 'center',
    background: disabled ? 'var(--bg-secondary)' : 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border)'}`,
    boxShadow: focused && !error ? '0 0 0 3px var(--accent-light)' : 'var(--shadow-sm)',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    overflow: 'hidden',
  };

  const prefixStyle: React.CSSProperties = {
    padding: '0 var(--space-3)',
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'center',
    borderInlineEnd: '1px solid var(--border)',
    flexShrink: 0,
    userSelect: 'none',
  };

  const sharedInputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 'var(--font-size-base)',
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    fontFamily: 'var(--font-family)',
    direction: type === 'number' || type === 'tel' ? 'ltr' : 'rtl',
    textAlign: type === 'number' || type === 'tel' ? 'start' : 'start',
    padding: `var(--space-3) var(--space-4)`,
    lineHeight: '1.5',
    width: '100%',
    resize: 'none',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--danger)',
    fontWeight: 500,
    marginTop: '2px',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--text-tertiary)',
    marginTop: '2px',
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={fieldRowStyle}>
        {prefix && <span style={prefixStyle}>{prefix}</span>}
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            rows={rows}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...sharedInputStyle, paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}
          />
        ) : (
          <input
            id={inputId}
            type={type === 'number' ? 'text' : type}
            inputMode={type === 'number' ? 'decimal' : undefined}
            pattern={type === 'number' ? '[0-9]*' : undefined}
            value={value}
            onChange={(e) => onChange(type === 'number' ? normalizeDigits(e.target.value) : e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={sharedInputStyle}
          />
        )}
      </div>
      {error && <span style={errorStyle}>{error}</span>}
      {!error && hint && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

export default Input;

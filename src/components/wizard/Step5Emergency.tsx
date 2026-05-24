import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { formatCurrency, parseCurrencyInput } from '../../utils/formatting';

type ReserveOption = '0' | '5' | '10' | '15' | 'custom';
type ReserveMode = 'from_budget' | 'extra';

interface Step5EmergencyProps {
  budget: number;
  value: number;
  mode: ReserveMode;
  onChange: (amount: number, mode: ReserveMode) => void;
  onNext: () => void;
}

const PCT_OPTIONS = [
  { key: '5' as const,  label: '5%' },
  { key: '10' as const, label: '10%', badge: 'مُوصى به' },
  { key: '15' as const, label: '15%' },
];

const MODE_OPTIONS: { key: ReserveMode; label: string; desc: string }[] = [
  { key: 'from_budget', label: 'من الميزانية',  desc: 'ينخصم من ميزانيتك الإجمالية، والباقي يتوزع على خطة الزواج.' },
  { key: 'extra',       label: 'مبلغ إضافي',   desc: 'ينحسب كاحتياطي فوق الميزانية، وما يقلل المبلغ المتاح للخطة.' },
];

export default function Step5Emergency({ budget, value, onChange, onNext }: Step5EmergencyProps) {
  const [selected, setSelected] = useState<ReserveOption>('10');
  const [customRaw, setCustomRaw] = useState('');
  const [customMode, setCustomMode] = useState<ReserveMode>('from_budget');

  useEffect(() => {
    if (budget > 0) onChange(Math.round(budget * 0.1), 'from_budget');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(opt: ReserveOption) {
    setSelected(opt);
    if (opt === '0') {
      onChange(0, 'from_budget');
    } else if (opt === 'custom') {
      onChange(parseCurrencyInput(customRaw), customMode);
    } else {
      onChange(Math.round(budget * parseInt(opt) / 100), 'from_budget');
    }
  }

  function onCustomRaw(raw: string) {
    setCustomRaw(raw);
    onChange(parseCurrencyInput(raw), customMode);
  }

  function onCustomMode(m: ReserveMode) {
    setCustomMode(m);
    onChange(parseCurrencyInput(customRaw), m);
  }

  const effectiveMode: ReserveMode = selected === 'custom' ? customMode : 'from_budget';
  const deducted = effectiveMode === 'from_budget' && selected !== '0';
  const showPreview = budget > 0 && selected !== '0' && value > 0;

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={iconStyle}>🛡️</div>
        <h1 style={titleStyle}>تبغي نخصص احتياطي للطوارئ؟</h1>
        <p style={subtitleStyle}>مبلغ بسيط على جنب للزيادات غير المتوقعة.</p>

        {/* Percentage row */}
        <div style={pctRowStyle}>
          {PCT_OPTIONS.map(({ key, label, badge }) => {
            const active = selected === key;
            const amt = budget > 0 ? Math.round(budget * parseInt(key) / 100) : 0;
            return (
              <button key={key} type="button" style={pctBtnStyle(active)} onClick={() => pick(key)}>
                <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 800 }}>{label}</span>
                {badge && (
                  <span style={{ fontSize: '10px', color: active ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                    {badge}
                  </span>
                )}
                {budget > 0 && (
                  <span className="num" style={{ fontSize: '11px', color: active ? 'var(--accent-dark)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                    {formatCurrency(amt)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary options */}
        <div style={secondaryRowStyle}>
          <button type="button" style={secondaryBtnStyle(selected === 'custom')} onClick={() => pick('custom')}>
            مبلغ مخصص
          </button>
          <button type="button" style={secondaryBtnStyle(selected === '0')} onClick={() => pick('0')}>
            بدون احتياطي
          </button>
        </div>

        {/* Custom amount + mode */}
        {selected === 'custom' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <span style={fieldLabelStyle}>مبلغ الاحتياطي</span>
              <div style={fieldRowStyle}>
                <span style={prefixStyle}>د.إ</span>
                <input
                  type="number"
                  value={customRaw}
                  min={0}
                  placeholder="0"
                  onChange={e => onCustomRaw(e.target.value)}
                  style={numInputStyle}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={fieldLabelStyle}>طريقة حساب الاحتياطي</span>
              {MODE_OPTIONS.map(({ key: m, label, desc }) => {
                const active = customMode === m;
                return (
                  <button key={m} type="button" style={modeBtnStyle(active)} onClick={() => onCustomMode(m)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                      <div style={radioStyle(active)} />
                      <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {label}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, paddingInlineStart: '22px' }}>
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div style={previewCardStyle}>
            <Row label="الميزانية الإجمالية" value={formatCurrency(budget)} />
            <Row
              label={deducted ? 'احتياطي الطوارئ' : 'احتياطي إضافي'}
              value={deducted ? `− ${formatCurrency(value)}` : formatCurrency(value)}
              color="var(--warning)"
            />
            <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
            <Row
              label="المتاح للخطة"
              value={formatCurrency(deducted ? Math.max(0, budget - value) : budget)}
              color="var(--accent)"
              bold
            />
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          التالي →
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--font-size-sm)', color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: bold ? 800 : 700, color: color ?? 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' };
const contentStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'var(--space-4)', gap: 'var(--space-4)', overflowY: 'auto' };
const iconStyle: React.CSSProperties = { fontSize: '48px', lineHeight: 1 };
const titleStyle: React.CSSProperties = { fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', margin: 0 };
const subtitleStyle: React.CSSProperties = { fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.7, margin: 0 };
const pctRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', width: '100%' };

function pctBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    padding: 'var(--space-3) var(--space-2)',
    borderRadius: 'var(--radius-lg)',
    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-light)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    fontFamily: 'var(--font-family)',
  };
}

const secondaryRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', width: '100%' };

function secondaryBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-lg)',
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-light)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)',
    fontWeight: active ? 700 : 500,
    transition: 'all var(--transition-fast)',
    fontFamily: 'var(--font-family)',
  };
}

const fieldLabelStyle: React.CSSProperties = { fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' };
const fieldRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' };
const prefixStyle: React.CSSProperties = { padding: '0 var(--space-3)', fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', alignSelf: 'stretch', display: 'flex', alignItems: 'center', borderInlineEnd: '1px solid var(--border)', flexShrink: 0, userSelect: 'none' };
const numInputStyle: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)', padding: 'var(--space-3) var(--space-4)', direction: 'ltr', width: '100%' };

function modeBtnStyle(active: boolean): React.CSSProperties {
  return {
    width: '100%',
    textAlign: 'start',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-light)' : 'var(--bg-card)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    fontFamily: 'var(--font-family)',
  };
}

function radioStyle(active: boolean): React.CSSProperties {
  return {
    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent)' : 'transparent',
    boxShadow: active ? 'inset 0 0 0 3px var(--bg-card)' : 'none',
    transition: 'all var(--transition-fast)',
  };
}

const previewCardStyle: React.CSSProperties = { width: '100%', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' };
const footerStyle: React.CSSProperties = { padding: 'var(--space-6) 0 var(--space-4)', flexShrink: 0 };

import React from 'react';
import Button from '../common/Button';
import { parseCurrencyInput, formatCurrency } from '../../utils/formatting';

interface Step4BudgetProps {
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
}

export default function Step4Budget({ value, onChange, onNext }: Step4BudgetProps) {
  const [rawInput, setRawInput] = React.useState(value > 0 ? String(value) : '');

  function handleInputChange(raw: string) {
    setRawInput(raw);
    onChange(parseCurrencyInput(raw));
  }

  const displayFormatted = value > 0 ? formatCurrency(value) : null;

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={decorStyle}>💰</div>
        <h1 style={titleStyle}>كم تتوقع ميزانيتك الإجمالية؟</h1>
        <p style={subtitleStyle}>تقريبي، مش لازم يكون دقيق</p>

        <div style={inputBlockStyle}>
          <label style={labelStyle} htmlFor="budget-input">
            الميزانية الإجمالية
          </label>
          <div style={fieldRowStyle}>
            <span style={prefixStyle}>D</span>
            <input
              id="budget-input"
              type="number"
              value={rawInput}
              min={0}
              placeholder="150,000"
              onChange={(e) => handleInputChange(e.target.value)}
              style={numInputStyle}
            />
          </div>

          {displayFormatted && (
            <div style={previewStyle}>
              <span style={previewLabelStyle}>المبلغ:</span>
              <span style={previewAmountStyle}>{displayFormatted}</span>
            </div>
          )}
        </div>

        <div style={hintCardStyle}>
          <span style={hintIconStyle}>💡</span>
          <p style={hintTextStyle}>
            لا تشيل هم، تقدر تعدلها لاحقًا. هذا المبلغ تقريبي فقط.
          </p>
        </div>
      </div>

      <div style={footerStyle}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onNext}
        >
          التالي →
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
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 'var(--space-8)',
};

const decorStyle: React.CSSProperties = {
  fontSize: '56px',
  marginBottom: 'var(--space-5)',
  lineHeight: 1,
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: 'var(--space-2)',
  textAlign: 'center',
  lineHeight: 1.4,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-6)',
  textAlign: 'center',
};

const inputBlockStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-5)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
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

const numInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 'var(--font-size-lg)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-family)',
  padding: 'var(--space-3) var(--space-4)',
  direction: 'ltr',
  width: '100%',
};

const previewStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  paddingInlineStart: 'var(--space-1)',
};

const previewLabelStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
};

const previewAmountStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  color: 'var(--accent)',
};

const hintCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  background: 'var(--accent-light)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
};

const hintIconStyle: React.CSSProperties = {
  fontSize: '20px',
  flexShrink: 0,
};

const hintTextStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  margin: 0,
};

const footerStyle: React.CSSProperties = {
  padding: 'var(--space-6) 0 var(--space-4)',
};

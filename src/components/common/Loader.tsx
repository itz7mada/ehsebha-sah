import React from 'react';

export function Loader() {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-6)',
    zIndex: 9999,
  };

  const appNameStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 800,
    color: 'var(--accent)',
    fontFamily: 'var(--font-family)',
    letterSpacing: '-0.5px',
    textAlign: 'center',
    lineHeight: 1.2,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-family)',
    textAlign: 'center',
    marginTop: 'calc(-1 * var(--space-4))',
  };

  const spinnerRingStyle: React.CSSProperties = {
    width: '52px',
    height: '52px',
    borderRadius: 'var(--radius-full)',
    border: '3px solid var(--accent-light)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.9s cubic-bezier(0.5,0,0.5,1) infinite',
  };

  const dotsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 'var(--space-2)',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle} role="status" aria-label="جاري التحميل">
      <div>
        <p style={appNameStyle}>زواج بوعي</p>
        <p style={subtitleStyle}>تخطيط مالي لزفافك</p>
      </div>
      <div style={spinnerRingStyle} />
      <div style={dotsStyle}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              opacity: 0.4,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Loader;

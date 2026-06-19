import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getWeddingCountdown } from '../utils/formatting';
import { CalendarIcon } from '../components/common/Icons';

interface Milestone {
  title: string;
  detail?: string;
  done: boolean;
}

export default function Journey() {
  const { state } = useApp();
  const { expenses, categories, support, stats, settings } = state;

  const daysRemaining = stats?.daysRemaining ?? null;
  const countdown = getWeddingCountdown(daysRemaining);

  const activeCats = categories.filter(c => c.isActive && c.name !== 'الطوارئ');
  const totalPaid = expenses.reduce((s, e) => s + e.paidAmount, 0);
  const totalSupport = support.reduce((s, i) => s + i.amount, 0);
  const budget = settings?.budget ?? 0;

  // Milestones derived purely from the user's current data — they fill in as the plan grows.
  const milestones: Milestone[] = [
    { title: 'بدأت التخطيط', done: !!settings?.setupComplete },
    { title: 'حدّدت الميزانية', done: budget > 0, detail: budget > 0 ? formatCurrency(budget) : undefined },
    { title: 'رتّبت أقسام الخطة', done: activeCats.length > 0, detail: activeCats.length > 0 ? `${activeCats.length} أقسام` : undefined },
    { title: 'أضفت أول بند', done: expenses.length > 0, detail: expenses.length > 0 ? `${expenses.length} بند` : undefined },
    { title: 'سجّلت أول دفعة', done: totalPaid > 0, detail: totalPaid > 0 ? `دفعت ${formatCurrency(totalPaid)}` : undefined },
    { title: 'أضفت مساهمة', done: totalSupport > 0, detail: totalSupport > 0 ? formatCurrency(totalSupport) : undefined },
  ];

  const nextIndex = milestones.findIndex(m => !m.done);
  const doneCount = milestones.filter(m => m.done).length;

  return (
    <div style={{ flex: 1, background: 'var(--bg-primary)' }} className="animate-fade-in">
      <div style={headerStyle}>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          رحلتي
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
          خطوة بخطوة نحو يوم الزواج
        </p>
      </div>

      <div style={contentStyle}>
        <div style={timelineStyle}>
          {milestones.map((m, i) => (
            <MilestoneRow key={m.title} milestone={m} isNext={i === nextIndex} />
          ))}

          {/* Destination — the wedding day */}
          <div style={rowStyle}>
            <div style={railStyle}>
              <div style={destDotStyle} aria-hidden="true">
                <CalendarIcon size={15} color="var(--text-inverse)" />
              </div>
            </div>
            <div style={destCardStyle}>
              <span style={destTitleStyle}>يوم الزواج</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span className="num" style={destValueStyle}>{countdown.value}</span>
                <span style={destSubStyle}>{countdown.sub}</span>
              </div>
            </div>
          </div>
        </div>

        <p style={progressNoteStyle}>
          أنجزت <span className="num" style={{ fontWeight: 800, color: 'var(--accent)' }}>{doneCount}</span> من {milestones.length} خطوات
        </p>
      </div>
    </div>
  );
}

function MilestoneRow({ milestone, isNext }: { milestone: Milestone; isNext: boolean }) {
  const { done } = milestone;
  return (
    <div style={rowStyle}>
      <div style={railStyle}>
        <div style={done ? doneDotStyle : (isNext ? nextDotStyle : pendingDotStyle)} aria-hidden="true">
          {done && (
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div style={{ ...connectorStyle, background: done ? 'var(--accent)' : 'var(--border)' }} />
      </div>
      <div style={rowContentStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: done ? 700 : 600,
            color: done ? 'var(--text-primary)' : isNext ? 'var(--accent)' : 'var(--text-tertiary)',
          }}>
            {milestone.title}
          </span>
          {isNext && <span style={nextTagStyle}>التالي</span>}
        </div>
        {milestone.detail && (
          <span className="num" style={detailStyle}>{milestone.detail}</span>
        )}
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: 'var(--page-top) var(--space-5) var(--space-4)',
  background: 'var(--bg-card)',
  borderBottom: '1px solid var(--border-light)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

const contentStyle: React.CSSProperties = {
  padding: 'var(--space-5) var(--space-4)',
  maxWidth: '480px',
  margin: '0 auto',
  paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-6))',
};

const timelineStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
};

const railStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'stretch',
  width: 22,
  flexShrink: 0,
};

const baseDot: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const doneDotStyle: React.CSSProperties = {
  ...baseDot,
  background: 'var(--accent)',
};

const nextDotStyle: React.CSSProperties = {
  ...baseDot,
  background: 'var(--bg-card)',
  border: '2px solid var(--accent)',
  boxShadow: '0 0 0 4px var(--accent-light)',
};

const pendingDotStyle: React.CSSProperties = {
  ...baseDot,
  background: 'var(--bg-card)',
  border: '2px solid var(--border)',
};

const destDotStyle: React.CSSProperties = {
  ...baseDot,
  background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
};

const connectorStyle: React.CSSProperties = {
  width: 2,
  flex: 1,
  minHeight: 16,
  marginTop: 2,
  borderRadius: 'var(--radius-full)',
};

const rowContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  paddingBottom: 'var(--space-5)',
  paddingTop: '1px',
  minWidth: 0,
};

const detailStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
};

const nextTagStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--accent)',
  background: 'var(--accent-light)',
  borderRadius: 'var(--radius-full)',
  padding: '2px 8px',
};

const destCardStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'var(--space-3) var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  marginTop: '-2px',
};

const destTitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  color: 'var(--text-secondary)',
};

const destValueStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xl)',
  fontWeight: 800,
  color: 'var(--accent)',
  lineHeight: 1,
};

const destSubStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
};

const progressNoteStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  margin: 'var(--space-5) 0 0',
};

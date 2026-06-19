import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getWeddingCountdown } from '../utils/formatting';
import { WalletIcon, GridIcon, PlusIcon, CheckIcon, HeartIcon, CalendarIcon, ClockIcon } from '../components/common/Icons';

type IconCmp = (props: { size: number; color: string }) => React.ReactElement;
type NodeState = 'done' | 'next' | 'pending';

interface Milestone {
  title: string;
  detail?: string;
  done: boolean;
  Icon: IconCmp;
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
    { title: 'بدأت التخطيط', done: !!settings?.setupComplete, Icon: ClockIcon },
    { title: 'حدّدت الميزانية', done: budget > 0, detail: budget > 0 ? formatCurrency(budget) : undefined, Icon: WalletIcon },
    { title: 'رتّبت أقسام الخطة', done: activeCats.length > 0, detail: activeCats.length > 0 ? `${activeCats.length} أقسام` : undefined, Icon: GridIcon },
    { title: 'أضفت أول بند', done: expenses.length > 0, detail: expenses.length > 0 ? `${expenses.length} بند` : undefined, Icon: PlusIcon },
    { title: 'سجّلت أول دفعة', done: totalPaid > 0, detail: totalPaid > 0 ? `دفعت ${formatCurrency(totalPaid)}` : undefined, Icon: CheckIcon },
    { title: 'أضفت مساهمة', done: totalSupport > 0, detail: totalSupport > 0 ? formatCurrency(totalSupport) : undefined, Icon: HeartIcon },
  ];

  const doneCount = milestones.filter(m => m.done).length;
  const nextIndex = milestones.findIndex(m => !m.done);
  const progress = Math.round((doneCount / milestones.length) * 100);

  return (
    <div style={{ flex: 1, background: 'var(--bg-primary)' }} className="animate-fade-in">
      <div style={pageHeaderStyle}>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          رحلتي
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
          خطوة بخطوة نحو يوم الزواج
        </p>
      </div>

      <div style={contentStyle}>

        {/* Hero — countdown + overall journey progress */}
        <div style={heroStyle}>
          <div style={heroGlowStyle} aria-hidden="true" />
          <div style={heroTopBarStyle} aria-hidden="true" />
          <span style={heroLabelStyle}>الطريق إلى يوم الزواج</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', direction: 'rtl' }}>
            <span className="num" style={heroNumberStyle}>{countdown.value}</span>
            <span style={heroSubStyle}>{countdown.sub}</span>
          </div>
          <div style={heroTrackStyle}>
            <div style={{ ...heroFillStyle, width: `${progress}%` }} />
          </div>
          <span style={heroProgressLabelStyle}>
            أنجزت <span className="num" style={{ fontWeight: 800, color: 'var(--accent)' }}>{doneCount}</span> من {milestones.length} خطوات
          </span>
        </div>

        {/* Milestone timeline */}
        <div style={timelineStyle}>
          {milestones.map((m, i) => (
            <MilestoneRow key={m.title} milestone={m} isNext={i === nextIndex} />
          ))}

          {/* Destination — the wedding day */}
          <div style={rowStyle}>
            <div style={railStyle}>
              <div style={destIconStyle} aria-hidden="true">
                <CalendarIcon size={17} color="var(--text-inverse)" />
              </div>
            </div>
            <div style={destCardStyle}>
              <span style={destTitleStyle}>يوم الزواج</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                <span className="num" style={destValueStyle}>{countdown.value}</span>
                <span style={destSubStyle}>{countdown.sub}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MilestoneRow({ milestone, isNext }: { milestone: Milestone; isNext: boolean }) {
  const stateKey: NodeState = milestone.done ? 'done' : isNext ? 'next' : 'pending';
  const iconColor = stateKey === 'done' ? 'var(--text-inverse)' : stateKey === 'next' ? 'var(--accent)' : 'var(--text-tertiary)';

  return (
    <div style={rowStyle}>
      <div style={railStyle}>
        <div style={iconCircleStyle(stateKey)} aria-hidden="true">
          {milestone.done
            ? <CheckIcon size={16} color="var(--text-inverse)" />
            : <milestone.Icon size={15} color={iconColor} />}
        </div>
        <div style={{ ...connectorStyle, background: milestone.done ? 'var(--accent)' : 'var(--border)' }} />
      </div>

      <div style={cardStyle(stateKey)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <span style={titleStyle(stateKey)}>{milestone.title}</span>
          {milestone.done
            ? <span style={doneChipStyle}>تم</span>
            : isNext ? <span style={nextChipStyle}>التالي</span> : null}
        </div>
        {milestone.detail && <span className="num" style={detailStyle}>{milestone.detail}</span>}
      </div>
    </div>
  );
}

const pageHeaderStyle: React.CSSProperties = {
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
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

/* --- Hero --- */
const heroStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-2xl)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.06)',
  padding: 'var(--space-6)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const heroGlowStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(130% 90% at 90% -10%, rgba(201,147,104,0.16), transparent 55%)',
  pointerEvents: 'none',
};

const heroTopBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  insetInlineStart: 0,
  insetInlineEnd: 0,
  height: '3px',
  background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))',
};

const heroLabelStyle: React.CSSProperties = {
  position: 'relative',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
};

const heroNumberStyle: React.CSSProperties = {
  fontSize: '44px',
  fontWeight: 800,
  color: 'var(--accent)',
  lineHeight: 1,
  letterSpacing: '-0.02em',
};

const heroSubStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-md)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const heroTrackStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '8px',
  background: 'var(--track)',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
  marginTop: '4px',
};

const heroFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 'inherit',
  background: 'linear-gradient(90deg, var(--accent-dark), var(--accent))',
  transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
};

const heroProgressLabelStyle: React.CSSProperties = {
  position: 'relative',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

/* --- Timeline --- */
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
  width: 36,
  flexShrink: 0,
};

const baseIcon: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

function iconCircleStyle(stateKey: NodeState): React.CSSProperties {
  if (stateKey === 'done') return { ...baseIcon, background: 'var(--accent)' };
  if (stateKey === 'next') return { ...baseIcon, background: 'var(--accent-light)', border: '2px solid var(--accent)', boxShadow: '0 0 0 4px var(--accent-light)' };
  return { ...baseIcon, background: 'var(--bg-secondary)', border: '1px solid var(--border)' };
}

const destIconStyle: React.CSSProperties = {
  ...baseIcon,
  background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
  boxShadow: '0 4px 12px rgba(201,147,104,0.35)',
};

const connectorStyle: React.CSSProperties = {
  width: 2,
  flex: 1,
  minHeight: 14,
  marginTop: 4,
  borderRadius: 'var(--radius-full)',
};

function cardStyle(stateKey: NodeState): React.CSSProperties {
  return {
    flex: 1,
    minWidth: 0,
    marginBottom: 'var(--space-3)',
    background: stateKey === 'pending' ? 'transparent' : 'var(--bg-card)',
    border: `1px solid ${stateKey === 'next' ? 'var(--accent)' : stateKey === 'pending' ? 'var(--border-light)' : 'var(--border-light)'}`,
    borderRadius: 'var(--radius-lg)',
    boxShadow: stateKey === 'pending' ? 'none' : 'var(--shadow-sm)',
    padding: 'var(--space-3) var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };
}

function titleStyle(stateKey: NodeState): React.CSSProperties {
  return {
    fontSize: 'var(--font-size-base)',
    fontWeight: stateKey === 'done' ? 700 : 600,
    color: stateKey === 'done' ? 'var(--text-primary)' : stateKey === 'next' ? 'var(--accent)' : 'var(--text-tertiary)',
  };
}

const detailStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
};

const doneChipStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--success)',
  background: 'var(--success-light)',
  borderRadius: 'var(--radius-full)',
  padding: '2px 8px',
  flexShrink: 0,
};

const nextChipStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--accent)',
  background: 'var(--accent-light)',
  borderRadius: 'var(--radius-full)',
  padding: '2px 8px',
  flexShrink: 0,
};

const destCardStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'var(--bg-card)',
  border: '1px solid var(--accent)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-md)',
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
};

const destTitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  color: 'var(--text-secondary)',
};

const destValueStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-2xl)',
  fontWeight: 800,
  color: 'var(--accent)',
  lineHeight: 1,
};

const destSubStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
};

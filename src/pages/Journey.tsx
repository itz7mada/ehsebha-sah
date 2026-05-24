import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatting';
import type { Category, ExpenseItem } from '../types';

export default function Journey() {
  const { state } = useApp();
  const { expenses, categories, stats } = state;

  const daysRemaining = stats?.daysRemaining ?? null;
  const paidItems = expenses.filter(e => e.status === 'paid');
  const partialItems = expenses.filter(e => e.status === 'partial');
  const unpaidItems = expenses
    .filter(e => e.status === 'unpaid')
    .sort((a, b) => b.expectedAmount - a.expectedAmount);

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));
  const hasData = expenses.length > 0;

  return (
    <div style={{ flex: 1, background: 'var(--bg-primary)' }} className="animate-fade-in">
      <div style={{
        padding: 'var(--space-5)',
        paddingTop: 'var(--page-top)',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
          رحلتي
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          نظرة شاملة على مسيرتك
        </p>
      </div>

      <div style={contentStyle}>
        {/* Countdown */}
        <div style={countdownStyle}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            باقي على الزواج
          </span>
          {daysRemaining === null ? (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
              لم يُحدَّد تاريخ الزواج بعد
            </span>
          ) : daysRemaining < 0 ? (
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', lineHeight: 1.1 }}>
              تهانينا
            </span>
          ) : daysRemaining === 0 ? (
            <span className="num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>
              اليوم
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="num" style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                {daysRemaining}
              </span>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                يومًا
              </span>
            </div>
          )}
        </div>

        {!hasData ? (
          <div style={emptyWrapStyle}>
            <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
              رحلتك تبدأ من هنا
            </span>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', lineHeight: 1.7, margin: 0, maxWidth: '260px', textAlign: 'center' }}>
              ابدأ بإضافة عناصر في خطتك وستظهر هنا تلقائيًا
            </p>
          </div>
        ) : (
          <>
            {partialItems.length > 0 && (
              <JourneySection title="يحتاج انتباه" accentColor="var(--warning)">
                {partialItems.map(item => (
                  <JourneyItemRow key={item.id} item={item} category={categoryMap.get(item.categoryId)} />
                ))}
              </JourneySection>
            )}

            <JourneySection title="القادم عليك" accentColor="var(--accent)">
              {unpaidItems.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--success)', fontWeight: 600, textAlign: 'center', padding: 'var(--space-2) 0', margin: 0 }}>
                  ما شاء الله، كل شيء منجز
                </p>
              ) : (
                unpaidItems.slice(0, 8).map(item => (
                  <JourneyItemRow key={item.id} item={item} category={categoryMap.get(item.categoryId)} />
                ))
              )}
            </JourneySection>

            {paidItems.length > 0 && (
              <JourneySection title="تم إنجازه" accentColor="var(--success)">
                {paidItems.map(item => (
                  <JourneyItemRow key={item.id} item={item} category={categoryMap.get(item.categoryId)} />
                ))}
              </JourneySection>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function JourneySection({ title, accentColor, children }: {
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
        <div style={{ width: 4, height: 16, borderRadius: 'var(--radius-full)', background: accentColor, flexShrink: 0 }} />
        <h2 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.01em', margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {children}
      </div>
    </div>
  );
}

function JourneyItemRow({ item, category }: { item: ExpenseItem; category: Category | undefined }) {
  const isPaid = item.status === 'paid';
  const isPartial = item.status === 'partial';
  const displayAmount = isPaid ? item.paidAmount : item.expectedAmount;
  const amountColor = isPaid ? 'var(--success)' : isPartial ? 'var(--warning)' : 'var(--text-primary)';

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${isPaid ? 'var(--success-light)' : 'var(--border-light)'}`,
      padding: 'var(--space-3) var(--space-4)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
    }}>
      {isPaid ? (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : isPartial ? (
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid var(--warning)', background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warning)' }} />
        </div>
      ) : (
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: isPaid ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: isPaid ? 'line-through' : 'none',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.name}
        </span>
        {category && (
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {category.name}
          </span>
        )}
      </div>

      <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: amountColor, flexShrink: 0 }}>
        {formatCurrency(displayAmount)}
      </span>
    </div>
  );
}

const contentStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  maxWidth: '480px',
  margin: '0 auto',
  paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-6))',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const countdownStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-light)',
  boxShadow: 'var(--shadow-sm)',
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const emptyWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  paddingTop: 'var(--space-8)',
  paddingBottom: 'var(--space-4)',
};

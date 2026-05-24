import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BudgetHero } from '../components/dashboard/BudgetHero';
import { SectionCard } from '../components/expenses/SectionCard';
import { BottomSheet } from '../components/common/BottomSheet';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { PlusIcon } from '../components/common/Icons';
import { getDaysLabel, maskAmount, parseCurrencyInput, formatCurrency, now, generateId } from '../utils/formatting';
import * as db from '../db/database';
import type { Category } from '../types';

const CAT_COLORS = [
  '#C99368', // warm gold
  '#4CAF82', // soft green
  '#5B9BD5', // muted blue
  '#9B7ED8', // soft lavender
  '#C8657A', // muted rose
  '#8B6548', // warm brown
  '#5BBDAA', // soft teal
  '#8A8F98', // neutral gray
];

type ReserveOption = '0' | '5' | '10' | '15' | 'custom';
type ReserveMode = 'from_budget' | 'extra';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { settings, stats, expenses, categories } = state;

  const [showAddCatSheet, setShowAddCatSheet] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudgetRaw, setNewCatBudgetRaw] = useState('');
  const [newCatNameErr, setNewCatNameErr] = useState('');
  const [newCatColor, setNewCatColor] = useState(CAT_COLORS[0]);
  const [newCatSaving, setNewCatSaving] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(
    () => localStorage.getItem('hideAmounts') === 'true'
  );

  // Emergency reserve sheet state
  const [showReserveSheet, setShowReserveSheet] = useState(false);
  const [reserveOption, setReserveOption] = useState<ReserveOption>('10');
  const [reserveCustomRaw, setReserveCustomRaw] = useState('');
  const [reserveMode, setReserveMode] = useState<ReserveMode>('from_budget');
  const [reserveSaving, setReserveSaving] = useState(false);

  async function handleAddCategory() {
    if (!newCatName.trim()) {
      setNewCatNameErr('أدخل الاسم');
      return;
    }
    setNewCatSaving(true);
    try {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), 0);
      const cat: Category = {
        id: generateId(),
        name: newCatName.trim(),
        emoji: '📋',
        isActive: true,
        order: maxOrder + 1,
        isSystem: false,
        budget: parseCurrencyInput(newCatBudgetRaw) || undefined,
        color: newCatColor,
      };
      await db.saveCategory(cat);
      dispatch({ type: 'SET_CATEGORIES', payload: [...categories, cat] });
      setShowAddCatSheet(false);
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setNewCatSaving(false);
    }
  }

  function toggleHideAmounts() {
    const next = !hideAmounts;
    setHideAmounts(next);
    localStorage.setItem('hideAmounts', String(next));
  }

  function openReserveSheet() {
    if (!settings) return;
    const cur = settings.emergencyReserve ?? 0;
    setReserveMode(settings.emergencyReserveMode ?? 'from_budget');
    if (cur === 0) {
      setReserveOption('0');
    } else {
      const matched = (['5', '10', '15'] as const).find(
        p => Math.round(settings.budget * parseInt(p) / 100) === cur
      );
      if (matched) {
        setReserveOption(matched);
      } else {
        setReserveOption('custom');
        setReserveCustomRaw(String(cur));
      }
    }
    setShowReserveSheet(true);
  }

  async function saveEmergencyReserve() {
    if (!settings) return;
    setReserveSaving(true);
    try {
      let amount = 0;
      let mode: ReserveMode = reserveMode;
      if (reserveOption === '0') {
        amount = 0;
        mode = 'from_budget';
      } else if (reserveOption === 'custom') {
        amount = parseCurrencyInput(reserveCustomRaw);
      } else {
        amount = Math.round(settings.budget * parseInt(reserveOption) / 100);
        mode = 'from_budget';
      }
      const updated = { ...settings, emergencyReserve: amount, emergencyReserveMode: mode, updatedAt: now() };
      await db.saveSettings(updated);
      dispatch({ type: 'UPDATE_SETTINGS', payload: updated });
      setShowReserveSheet(false);
    } finally {
      setReserveSaving(false);
    }
  }

  const activeCategories = categories
    .filter(c => c.isActive && c.name !== 'الطوارئ')
    .sort((a, b) => a.order - b.order);

  const supportReceived = state.support
    .filter(s => s.status === 'received')
    .reduce((sum, s) => sum + s.amount, 0);
  const supportTotal = state.support.reduce((sum, s) => sum + s.amount, 0);
  const supportExpected = supportTotal - supportReceived;

  const paidItems = expenses.filter(e => e.status === 'paid').length;
  const totalItems = expenses.length;

  if (!state.initialized || !stats) {
    return (
      <div style={pageStyle}>
        <div style={contentStyle}>
          <div className="skeleton" style={{ height: '28px', width: '60%', borderRadius: 'var(--radius-lg)', marginBottom: 4 }} />
          <div className="skeleton" style={{ height: '16px', width: '80%', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-xl)', marginTop: 8 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-xl)' }} />
            <div className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-xl)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-xl)' }} />
            <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-xl)' }} />
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = stats.daysRemaining;
  const emergencyReserve = stats.emergencyReserve;

  return (
    <div style={pageStyle}>
      <div className="animate-fade-in" style={contentStyle}>

        {/* Header */}
        <header style={headerStyle}>
          <h1 style={titleStyle}>خلنا نحسبها صح</h1>
          <p style={subtitleStyle}>نظرة سريعة على وضعك قبل يوم الزواج</p>
        </header>

        {/* Main budget card */}
        <BudgetHero
          stats={stats}
          hideAmounts={hideAmounts}
          onToggleHide={toggleHideAmounts}
        />

        {/* 2 secondary mini cards — tap to go to journey */}
        <div style={miniGridStyle}>
          <MiniCard
            label="باقي على الزواج"
            value={daysRemaining !== null ? String(Math.abs(daysRemaining)) : '—'}
            sub={daysRemaining !== null ? getDaysLabel(daysRemaining) : 'لم تُحدَّد التاريخ'}
            onClick={() => navigate('/journey')}
          />
          <MiniCard
            label="إنجاز الخطة"
            value={totalItems > 0 ? `${paidItems}/${totalItems}` : '—'}
            sub={totalItems > 0 ? 'بند مدفوع' : 'لا توجد بنود'}
            onClick={() => navigate('/journey')}
          />
        </div>

        {/* المساهمات + احتياطي الطوارئ — always visible */}
        <div style={miniGridStyle}>
          <button type="button" onClick={() => navigate('/support')} style={infoCardStyle}>
            <span style={infoCardLabelStyle}>المساهمات</span>
            {supportTotal > 0 ? (
              <>
                <span className="num" style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--success)' }}>
                  {maskAmount(supportReceived, hideAmounts)}
                </span>
                {supportExpected > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {maskAmount(supportExpected, hideAmounts)} متوقعة
                  </span>
                )}
              </>
            ) : (
              <>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                  لا توجد مساهمات
                </span>
                <span style={infoCardActionStyle}>إضافة ›</span>
              </>
            )}
          </button>

          <button type="button" onClick={openReserveSheet} style={infoCardStyle}>
            <span style={infoCardLabelStyle}>احتياطي الطوارئ</span>
            {emergencyReserve > 0 ? (
              <>
                <span className="num" style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--warning)' }}>
                  {maskAmount(emergencyReserve, hideAmounts)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {settings?.emergencyReserveMode === 'extra' ? 'مبلغ إضافي' : 'من الميزانية'}
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                  لم يُحدَّد بعد
                </span>
                <span style={infoCardActionStyle}>تحديد ›</span>
              </>
            )}
          </button>
        </div>

        {/* Planning sections */}
        {activeCategories.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={sectionTitleStyle}>خطة الزواج</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {activeCategories.map(category => (
                <SectionCard
                  key={category.id}
                  category={category}
                  expenses={expenses}
                  onClick={() => navigate(`/sections/${category.id}`)}
                  hideAmounts={hideAmounts}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add button */}
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={() => { setNewCatName(''); setNewCatBudgetRaw(''); setNewCatNameErr(''); setNewCatColor(CAT_COLORS[activeCategories.length % CAT_COLORS.length]); setShowAddCatSheet(true); }}
          icon={<PlusIcon size={20} color="currentColor" />}
        >
          إضافة بند رئيسي
        </Button>

      </div>

      <BottomSheet
        isOpen={showAddCatSheet}
        onClose={() => setShowAddCatSheet(false)}
        title="إضافة بند رئيسي"
        footer={
          <Button
            variant="primary"
            size="xl"
            fullWidth
            loading={newCatSaving}
            disabled={!newCatName.trim() || newCatSaving}
            onClick={handleAddCategory}
          >
            إضافة
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-2)' }}>
          <Input
            label="اسم البند الرئيسي"
            value={newCatName}
            onChange={v => { setNewCatName(v); if (v.trim()) setNewCatNameErr(''); }}
            placeholder="مثال: العرس"
            error={newCatNameErr}
            autoFocus
          />
          <Input
            label="الميزانية المخططة (اختياري)"
            value={newCatBudgetRaw}
            onChange={setNewCatBudgetRaw}
            type="number"
            placeholder="0"
            prefix="د.إ"
          />

          {/* Color picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>اللون</span>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {CAT_COLORS.map(color => {
                const active = newCatColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    aria-label={`لون ${color}`}
                    aria-pressed={active}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: color,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: active ? `0 0 0 2.5px var(--bg-primary), 0 0 0 4.5px ${color}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'box-shadow var(--transition-fast)',
                      flexShrink: 0,
                    }}
                  >
                    {active && (
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
                        <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Emergency reserve sheet */}
      <BottomSheet
        isOpen={showReserveSheet}
        onClose={() => setShowReserveSheet(false)}
        title="احتياطي الطوارئ"
        footer={
          <Button fullWidth variant="primary" size="xl" onClick={saveEmergencyReserve} loading={reserveSaving}>
            حفظ
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            مبلغ على جنب للزيادات غير المتوقعة.
          </p>

          {/* Percentage options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
            {(['5', '10', '15'] as const).map(pct => {
              const active = reserveOption === pct;
              const amt = settings ? Math.round(settings.budget * parseInt(pct) / 100) : 0;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setReserveOption(pct)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                    padding: 'var(--space-3) var(--space-2)',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-light)' : 'var(--bg-card)',
                    cursor: 'pointer', fontFamily: 'var(--font-family)',
                    transition: 'all var(--transition-fast)',
                    color: active ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 800 }}>{pct}%</span>
                  {pct === '10' && (
                    <span style={{ fontSize: '9px', fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                      مُوصى به
                    </span>
                  )}
                  <span className="num" style={{ fontSize: '11px', color: active ? 'var(--accent-dark)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                    {formatCurrency(amt)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {([{ k: 'custom', l: 'مبلغ مخصص' }, { k: '0', l: 'بدون احتياطي' }] as const).map(({ k, l }) => {
              const active = reserveOption === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setReserveOption(k)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-light)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 'var(--font-size-sm)',
                    fontWeight: active ? 700 : 500,
                    fontFamily: 'var(--font-family)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>

          {/* Custom amount + mode */}
          {reserveOption === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  مبلغ الاحتياطي
                </span>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <span style={{ padding: '0 var(--space-3)', fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', alignSelf: 'stretch', display: 'flex', alignItems: 'center', borderInlineEnd: '1px solid var(--border)', flexShrink: 0 }}>
                    د.إ
                  </span>
                  <input
                    type="number"
                    value={reserveCustomRaw}
                    min={0}
                    placeholder="0"
                    onChange={e => setReserveCustomRaw(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)', padding: 'var(--space-3) var(--space-4)', direction: 'ltr', width: '100%' }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  طريقة الحساب
                </span>
                {([
                  { m: 'from_budget' as ReserveMode, l: 'من الميزانية', d: 'ينخصم من الميزانية الإجمالية، والباقي يتوزع على خطة الزواج.' },
                  { m: 'extra' as ReserveMode, l: 'مبلغ إضافي', d: 'ينحسب كمبلغ على جنب، وما يقلل ميزانية الخطة.' },
                ]).map(({ m, l, d }) => {
                  const active = reserveMode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setReserveMode(m)}
                      style={{ width: '100%', textAlign: 'start', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-light)' : 'var(--bg-card)', cursor: 'pointer', fontFamily: 'var(--font-family)', transition: 'all var(--transition-fast)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '3px' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent)' : 'transparent', boxShadow: active ? 'inset 0 0 0 3px var(--bg-card)' : 'none', flexShrink: 0, transition: 'all var(--transition-fast)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{l}</span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, paddingInlineStart: '22px' }}>
                        {d}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

function MiniCard({ label, value, sub, onClick }: { label: string; value: string; sub: string; onClick: () => void }) {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--border-light)',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        textAlign: 'center',
        cursor: 'pointer',
        fontFamily: 'var(--font-family)',
        WebkitTapHighlightColor: 'transparent',
        transform: active ? 'translateY(-1px)' : undefined,
        transition: 'all var(--transition-fast)',
        width: '100%',
      }}
    >
      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</span>
      <span className="num" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{sub}</span>
    </button>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100dvh',
  background: 'var(--bg-primary)',
};

const contentStyle: React.CSSProperties = {
  padding: 'var(--space-4)',
  maxWidth: '480px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)',
  paddingTop: 'var(--page-top)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xl)',
  fontWeight: 800,
  color: 'var(--text-primary)',
  margin: 0,
  lineHeight: 1.2,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-tertiary)',
  margin: 0,
  fontWeight: 400,
};

const miniGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-3)',
};

const infoCardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-sm)',
  border: '1px solid var(--border-light)',
  padding: '14px 12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '4px',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  textAlign: 'start',
  WebkitTapHighlightColor: 'transparent',
  width: '100%',
};

const infoCardLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
  marginBottom: '2px',
};

const infoCardActionStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--accent)',
  fontWeight: 600,
  marginTop: '2px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  color: 'var(--text-primary)',
  margin: 0,
};

import React, { useState, useMemo } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatting';
import { generateShareImage, type ShareTopCat } from '../../utils/shareImage';
import type { Settings, BudgetStats, Category, ExpenseItem } from '../../types';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  stats: BudgetStats;
  categories: Category[];
  expenses: ExpenseItem[];
}

export function ShareSheet({ isOpen, onClose, settings, stats, categories, expenses }: ShareSheetProps) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const topCats = useMemo((): ShareTopCat[] => {
    const map: Record<string, ShareTopCat> = {};
    for (const exp of expenses) {
      const cat = categories.find(c => c.id === exp.categoryId);
      if (!cat || !cat.isActive) continue;
      if (!map[cat.id]) map[cat.id] = { name: cat.name, total: 0, paid: 0 };
      map[cat.id].total += exp.expectedAmount;
      map[cat.id].paid  += exp.paidAmount;
    }
    return Object.values(map)
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [expenses, categories]);

  const paidItems  = useMemo(() => expenses.filter(e => e.status === 'paid').length, [expenses]);
  const totalItems = expenses.length;

  async function handleShare() {
    setGenerating(true);
    try {
      const blob = await generateShareImage(settings.name, stats, topCats, paidItems, totalItems);
      const file = new File([blob], 'خطة-زواجي.png', { type: 'image/png' });

      // 1. Image share (native share sheet with file)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `خطة زواج ${settings.name}` });
        setDone(true);
        setTimeout(() => setDone(false), 2000);
        return;
      }

      // 2. Download image as fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'خطة-زواجي.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      // user cancelled — no-op
    } finally {
      setGenerating(false);
    }
  }

  const pct = Math.round(stats.spentPercentage);
  const days = stats.daysRemaining;
  const canShareFiles = !!(typeof navigator !== 'undefined' && navigator.canShare);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="شارك خطتك">

      {/* Preview card */}
      <div style={previewCard}>
        <div style={accentBar} />
        <div style={cardInner}>

          <div style={cardHead}>
            <p style={cardAppMark}>احسبها صح</p>
            <h2 style={cardName}>خطة زواج {settings.name}</h2>
          </div>

          <div style={sep} />

          <div style={statsList}>
            {days !== null && (
              <StatRow
                label={days >= 0 ? 'باقي على الفرح' : 'مضى على الفرح'}
                value={`${Math.abs(days)} يوم`}
                accent
              />
            )}
            <StatRow label="الميزانية الإجمالية" value={formatCurrency(stats.totalBudget)} />
            <StatRow label="المنجز" value={`${formatCurrency(stats.totalSpent)} · ${pct}٪`} />
            <StatRow label="المتبقي" value={formatCurrency(Math.max(0, stats.remaining))} />
          </div>

          {topCats.length > 0 && (
            <>
              <div style={sep} />
              <div style={catsBlock}>
                <p style={catsSectionLabel}>أبرز البنود</p>
                {topCats.map(c => <CatRow key={c.name} name={c.name} total={c.total} />)}
              </div>
            </>
          )}

          <div style={sep} />

          <div style={watermark}>
            <span style={watermarkApp}>✨ احسبها صح</span>
            <span style={watermarkUrl}>ehsebha-sah.pages.dev</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div style={actionsWrap}>
        <Button variant="primary" size="lg" fullWidth loading={generating} onClick={handleShare}>
          {done ? '✓ تم' : generating ? '' : canShareFiles ? 'شارك الخطة كصورة' : 'حفظ الصورة'}
        </Button>
        <p style={hintText}>
          {done
            ? 'الصورة جاهزة للإرسال.'
            : canShareFiles
              ? 'يُرسل الخطة كصورة عبر واتساب أو أي تطبيق.'
              : 'تُحفظ الصورة على جهازك مباشرة.'}
        </p>
      </div>
    </BottomSheet>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={statRow}>
      <span style={statLabel}>{label}</span>
      <span style={{ ...statValue, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function CatRow({ name, total }: { name: string; total: number }) {
  return (
    <div style={catRow}>
      <div style={catDot} />
      <span style={catName}>{name}</span>
      <span style={catAmt}>{formatCurrency(total)}</span>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const previewCard: React.CSSProperties = {
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
  background: 'var(--bg-primary)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
  marginBottom: 'var(--space-5)',
};
const accentBar: React.CSSProperties = {
  height: '3px',
  background: 'linear-gradient(90deg, var(--accent-dark), var(--accent), var(--accent-light))',
};
const cardInner: React.CSSProperties = {
  padding: 'var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
};
const cardHead: React.CSSProperties = { paddingBottom: 'var(--space-4)' };
const cardAppMark: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--accent)',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};
const cardName: React.CSSProperties = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.2,
};
const sep: React.CSSProperties = {
  height: '0.5px',
  background: 'var(--border-light)',
  marginBottom: 'var(--space-4)',
};
const statsList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  paddingBottom: 'var(--space-4)',
};
const statRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const statLabel: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};
const statValue: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
};
const catsBlock: React.CSSProperties = {
  paddingBottom: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};
const catsSectionLabel: React.CSSProperties = {
  margin: '0 0 var(--space-2)',
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
  letterSpacing: '0.8px',
  textTransform: 'uppercase' as const,
};
const catRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
};
const catDot: React.CSSProperties = {
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  background: 'var(--accent)',
  flexShrink: 0,
};
const catName: React.CSSProperties = { flex: 1, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 };
const catAmt: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' };
const watermark: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 'var(--space-1)',
};
const watermarkApp: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--accent)' };
const watermarkUrl: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
  direction: 'ltr',
};
const actionsWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' };
const hintText: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: 'var(--text-tertiary)',
  textAlign: 'center',
  lineHeight: 1.5,
};

import React, { useState, useMemo } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatting';
import { generateShareImage, type ShareTopCat } from '../../utils/shareImage';
import { getRolePlanTitle } from '../../types';
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
      const blob = await generateShareImage(settings.name, stats, topCats, paidItems, totalItems, settings.userRole);
      const file = new File([blob], 'خطة-زواجي.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `خطة زواج ${settings.name}` });
        setDone(true);
        setTimeout(() => setDone(false), 2000);
        return;
      }

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
      // user cancelled
    } finally {
      setGenerating(false);
    }
  }

  const pct = Math.min(100, Math.round(stats.spentPercentage));
  const days = stats.daysRemaining;
  const canShareFiles = !!(typeof navigator !== 'undefined' && navigator.canShare);

  const SK_LABEL: Record<string, string> = {
    comfortable: 'مريح', balanced: 'متوازن', attention: 'يحتاج انتباه', exceeded: 'تجاوز الميزانية',
  };
  const SK_COLOR: Record<string, string> = {
    comfortable: '#2FAE72', balanced: 'var(--accent)', attention: '#E67E22', exceeded: '#E74C3C',
  };
  const sk = stats.comfortLevel;
  const skLabel = SK_LABEL[sk] ?? 'متوازن';
  const skColor = SK_COLOR[sk] ?? 'var(--accent)';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="شارك خطتك">

      {/* ─── Preview mini-card ─────────────────────────────────── */}
      <div style={previewWrap}>

        {/* Gold top bar */}
        <div style={goldBar} />

        <div style={previewBody}>

          {/* App brand row */}
          <div style={brandRow}>
            <span style={brandName}>احسبها صح</span>
            <span style={statusPill(skColor)}>{skLabel}</span>
          </div>

          {/* Plan title */}
          <p style={planTitle}>{getRolePlanTitle(settings.userRole, settings.name)}</p>

          {/* ─── Hero: remaining ─── */}
          <div style={heroSection}>
            <p style={heroLabel}>المتبقي من الميزانية</p>
            <p style={heroValue}>{formatCurrency(Math.max(0, stats.remaining))}</p>
          </div>

          {/* ─── Progress bar ─── */}
          <div style={pgTrack}>
            <div style={pgFill(pct)} />
          </div>
          <div style={pgMeta}>
            <span style={pgMetaText}>{pct}٪ مصروف</span>
            <span style={pgMetaText}>{formatCurrency(stats.totalBudget)}</span>
          </div>

          {/* ─── Divider ─── */}
          <div style={divider} />

          {/* ─── Stats grid ─── */}
          <div style={statsGrid}>
            <MiniStat label="المصروف"    value={formatCurrency(stats.totalSpent)} accent />
            {days !== null && (
              <MiniStat
                label={days >= 0 ? 'باقي على الفرح' : 'مضى على الفرح'}
                value={`${Math.abs(days)} يوم`}
              />
            )}
            {stats.emergencyReserve > 0 && (
              <MiniStat label="احتياطي الطوارئ" value={formatCurrency(stats.emergencyReserve)} />
            )}
            {totalItems > 0 && (
              <MiniStat label="الإنجاز" value={`${paidItems} / ${totalItems} بند`} />
            )}
          </div>

          {/* ─── Top categories ─── */}
          {topCats.length > 0 && (
            <>
              <div style={divider} />
              <p style={catsHeading}>أبرز البنود</p>
              <div style={catsList}>
                {topCats.map(c => <CatMini key={c.name} cat={c} />)}
              </div>
            </>
          )}

          {/* ─── Watermark ─── */}
          <div style={wm}>
            <span style={wmApp}>احسبها صح</span>
            <span style={wmUrl}>ehsebha-sah.pages.dev</span>
          </div>

        </div>
      </div>

      {/* ─── Action ─────────────────────────────────────────────── */}
      <div style={actionsWrap}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={generating}
          onClick={handleShare}
        >
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

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={miniStatWrap}>
      <span style={miniStatVal(!!accent)}>{value}</span>
      <span style={miniStatLbl}>{label}</span>
    </div>
  );
}

function CatMini({ cat }: { cat: ShareTopCat }) {
  const pct = cat.total > 0 ? Math.min(100, (cat.paid / cat.total) * 100) : 0;
  return (
    <div style={catMiniWrap}>
      <div style={catMiniHead}>
        <span style={catMiniName}>{cat.name}</span>
        <span style={catMiniAmt}>{formatCurrency(cat.total)}</span>
      </div>
      <div style={catMiniTrack}>
        <div style={catMiniFill(pct)} />
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const previewWrap: React.CSSProperties = {
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
  background: 'var(--bg-card)',
  boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  marginBottom: 'var(--space-5)',
};

const goldBar: React.CSSProperties = {
  height: '4px',
  background: 'linear-gradient(90deg, var(--accent-dark, #9C6A38), var(--accent), var(--accent-light, #E8BE6A))',
};

const previewBody: React.CSSProperties = {
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const brandRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
};

const brandName: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--accent)',
  letterSpacing: '0.5px',
};

const statusPill = (color: string): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 600,
  color,
  background: `${color}18`,
  border: `1px solid ${color}40`,
  borderRadius: '20px',
  padding: '2px 10px',
});

const planTitle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: '17px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.3,
};

const heroSection: React.CSSProperties = {
  marginBottom: '8px',
};

const heroLabel: React.CSSProperties = {
  margin: '0 0 2px',
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

const heroValue: React.CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  lineHeight: 1.1,
  letterSpacing: '-0.5px',
};

const pgTrack: React.CSSProperties = {
  height: '5px',
  borderRadius: '10px',
  background: 'var(--border-light)',
  overflow: 'hidden',
  marginBottom: '4px',
};

const pgFill = (pct: number): React.CSSProperties => ({
  height: '100%',
  width: `${pct}%`,
  borderRadius: '10px',
  background: 'linear-gradient(90deg, var(--accent-dark, #9C6A38), var(--accent))',
  transition: 'width 0.4s ease',
});

const pgMeta: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '14px',
};

const pgMetaText: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
};

const divider: React.CSSProperties = {
  height: '0.5px',
  background: 'var(--border-light)',
  marginBottom: '12px',
};

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginBottom: '14px',
};

const miniStatWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const miniStatVal = (accent: boolean): React.CSSProperties => ({
  fontSize: '15px',
  fontWeight: 700,
  color: accent ? 'var(--accent)' : 'var(--text-primary)',
  lineHeight: 1.2,
});

const miniStatLbl: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-tertiary)',
  fontWeight: 400,
};

const catsHeading: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
  letterSpacing: '0.5px',
};

const catsList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '14px',
};

const catMiniWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const catMiniHead: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
};

const catMiniName: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const catMiniAmt: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const catMiniTrack: React.CSSProperties = {
  height: '3px',
  borderRadius: '6px',
  background: 'var(--border-light)',
  overflow: 'hidden',
};

const catMiniFill = (pct: number): React.CSSProperties => ({
  height: '100%',
  width: `${pct}%`,
  borderRadius: '6px',
  background: 'linear-gradient(90deg, var(--accent-dark, #9C6A38), var(--accent))',
});

const wm: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '4px',
  borderTop: '0.5px solid var(--border-light)',
  marginTop: '4px',
};

const wmApp: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--accent)',
};

const wmUrl: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-tertiary)',
  fontWeight: 400,
  direction: 'ltr',
};

const actionsWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const hintText: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: 'var(--text-tertiary)',
  textAlign: 'center',
  lineHeight: 1.5,
};

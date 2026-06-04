import { formatCurrency } from './formatting';
import type { BudgetStats } from '../types';

export interface ShareTopCat {
  name: string;
  total: number; // expectedAmount total
  paid: number;  // paidAmount total
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const sr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + sr, y);
  ctx.lineTo(x + w - sr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + sr);
  ctx.lineTo(x + w, y + h - sr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - sr, y + h);
  ctx.lineTo(x + sr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - sr);
  ctx.lineTo(x, y + sr);
  ctx.quadraticCurveTo(x, y, x + sr, y);
  ctx.closePath();
}

function progressBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, pct: number,
  bgColor: string, fillA: string, fillB: string,
) {
  ctx.fillStyle = bgColor;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(Math.min(w * pct / 100, w), pct > 0 ? h : 0);
  if (fw > 0) {
    const g = ctx.createLinearGradient(x, 0, x + fw, 0);
    g.addColorStop(0, fillA);
    g.addColorStop(1, fillB);
    ctx.fillStyle = g;
    rr(ctx, x, y, fw, h, h / 2);
    ctx.fill();
  }
}

function card(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, radius: number,
  fill: string, border: string, shadow: string,
) {
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, radius);
  ctx.stroke();
}

function goldBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, radius: number,
  colorA: string, colorMid: string, colorB: string,
) {
  ctx.save();
  rr(ctx, x, y, w, h, radius);
  ctx.clip();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, colorA);
  g.addColorStop(0.5, colorMid);
  g.addColorStop(1, colorB);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, 5);
  ctx.restore();
}

function txt(
  ctx: CanvasRenderingContext2D,
  text: string, size: number, weight: number, color: string,
  align: 'right' | 'left' | 'center', x: number, y: number, dir: 'rtl' | 'ltr' = 'rtl',
) {
  ctx.font = `${weight} ${size}px "Cairo", system-ui, -apple-system, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.direction = dir;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateShareImage(
  name: string,
  stats: BudgetStats,
  topCats: ShareTopCat[],
  paidItems: number,
  totalItems: number,
): Promise<Blob> {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  try {
    await Promise.all([
      document.fonts.load('800 64px Cairo'),
      document.fonts.load('700 28px Cairo'),
      document.fonts.load('600 22px Cairo'),
      document.fonts.load('400 18px Cairo'),
    ]);
  } catch { /* continue with fallback */ }

  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Palette ───────────────────────────────────────────────────
  const D = isDark;
  const C = {
    bg:          D ? '#0D0D0A' : '#F0EAE1',
    bgGrad:      D ? '#141410' : '#E8E0D4',
    card:        D ? '#1C1C18' : '#FFFFFF',
    cardBorder:  D ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    cardShadow:  D ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.10)',
    textPri:     D ? '#F0EFE8' : '#111827',
    textSec:     D ? '#9A9A94' : '#6B6B67',
    textTer:     D ? '#555550' : '#A0A0A0',
    accent:      D ? '#D4A240' : '#C99368',
    accentDark:  '#A87248',
    accentFade:  D ? 'rgba(212,162,64,0.12)' : '#F5E3D0',
    sep:         D ? 'rgba(255,255,255,0.07)' : '#E0D8CE',
    progBg:      D ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
  };

  const STATUS_COLOR: Record<string, string> = {
    comfortable: '#2FAE72',
    balanced: C.accent,
    attention: '#E67E22',
    exceeded: '#E74C3C',
  };
  const STATUS_BG: Record<string, string> = {
    comfortable: D ? 'rgba(47,174,114,0.15)' : '#D4F4E5',
    balanced: C.accentFade,
    attention: D ? 'rgba(230,126,34,0.15)' : '#FDEBD0',
    exceeded: D ? 'rgba(231,76,60,0.15)' : '#FADBD8',
  };
  const STATUS_LABEL: Record<string, string> = {
    comfortable: 'مريح',
    balanced: 'متوازن',
    attention: 'يحتاج انتباه',
    exceeded: 'تجاوز الميزانية',
  };

  // ── Canvas background ─────────────────────────────────────────
  const bgG = ctx.createLinearGradient(0, 0, 0, H);
  bgG.addColorStop(0, C.bg);
  bgG.addColorStop(1, C.bgGrad);
  ctx.fillStyle = bgG;
  ctx.fillRect(0, 0, W, H);

  // Warm radial glow at top
  const radG = ctx.createRadialGradient(W / 2, 0, 80, W / 2, 0, 480);
  radG.addColorStop(0, D ? 'rgba(212,162,64,0.07)' : 'rgba(201,147,104,0.12)');
  radG.addColorStop(1, 'transparent');
  ctx.fillStyle = radG;
  ctx.fillRect(0, 0, W, H);

  // ── Layout constants ──────────────────────────────────────────
  const OP = 44;         // outer padding from canvas edges
  const CP = 38;         // content padding inside cards
  const CARD_R = 24;
  const L = OP + CP;     // left text anchor
  const R = W - OP - CP; // right text anchor
  let y = 52;

  // ═══════════════════════════════════════════
  // SECTION 1 — HEADER
  // ═══════════════════════════════════════════

  // Decorative ring mark for app identity
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(W / 2, y + 12, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.arc(W / 2, y + 12, 5, 0, Math.PI * 2);
  ctx.fill();

  y += 44;
  txt(ctx, 'احسبها صح', 40, 800, C.accent, 'center', W / 2, y);
  y += 46;
  txt(ctx, 'ملخص خطة الزواج', 22, 500, C.textSec, 'center', W / 2, y);
  y += 36;
  txt(ctx, `خطة زواج ${name}`, 28, 700, C.textPri, 'center', W / 2, y);
  y += 16;

  // ═══════════════════════════════════════════
  // SECTION 2 — HERO BUDGET CARD
  // ═══════════════════════════════════════════

  y += 22;
  const heroX = OP, heroY = y, heroW = W - OP * 2, heroH = 350;

  card(ctx, heroX, heroY, heroW, heroH, CARD_R, C.card, C.cardBorder, C.cardShadow);
  goldBar(ctx, heroX, heroY, heroW, heroH, CARD_R, C.accentDark, C.accent, D ? 'rgba(212,162,64,0.25)' : '#F5E3D0');

  let hy = heroY + CP + 8;

  // "نظرة الميزانية" section title
  txt(ctx, 'نظرة الميزانية', 17, 600, C.textTer, 'right', R, hy);

  // Budget comfort level pill — top-left of card
  const sk = stats.comfortLevel;
  const sColor = STATUS_COLOR[sk] ?? C.accent;
  const sBg    = STATUS_BG[sk]    ?? C.accentFade;
  const sLabel = STATUS_LABEL[sk] ?? 'متوازن';
  ctx.font = `700 17px "Cairo", system-ui, Arial, sans-serif`;
  const pillTW = ctx.measureText(sLabel).width;
  const pillPX = 14, pillH = 26;
  const pillW = pillTW + pillPX * 2;
  const pillX = L;
  const pillY = hy - 19;
  ctx.fillStyle = sBg;
  rr(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = sColor;
  ctx.lineWidth = 1;
  rr(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();
  txt(ctx, sLabel, 17, 700, sColor, 'center', pillX + pillW / 2, pillY + 18);

  hy += 34;

  // Big remaining amount
  txt(ctx, formatCurrency(Math.max(0, stats.remaining)), 64, 800, C.textPri, 'right', R, hy);
  hy += 28;
  txt(ctx, 'المتبقي من ميزانيتك', 18, 500, C.textSec, 'right', R, hy);
  hy += 26;

  // Thin separator
  ctx.strokeStyle = C.sep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L, hy);
  ctx.lineTo(R, hy);
  ctx.stroke();
  hy += 22;

  // 3-column stats row (الميزانية | المصروف | نسبة الصرف)
  const pct = Math.min(100, Math.round(stats.spentPercentage));
  const cols3 = [
    { label: 'نسبة الصرف',           value: `${pct}%`,                               accent: false },
    { label: 'المصروف',               value: formatCurrency(stats.totalSpent),         accent: true  },
    { label: 'الميزانية الإجمالية',   value: formatCurrency(stats.totalBudget),         accent: false },
  ];
  const c3W = (heroW - CP * 2) / 3;
  cols3.forEach((col, i) => {
    const cx = heroX + CP + c3W * (i + 0.5);
    txt(ctx, col.value, 24, 700, col.accent ? C.accent : C.textPri, 'center', cx, hy + 24);
    txt(ctx, col.label, 15, 400, C.textTer, 'center', cx, hy + 46);
    // Column divider
    if (i < 2) {
      ctx.strokeStyle = C.sep;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(heroX + CP + c3W * (i + 1), hy + 4);
      ctx.lineTo(heroX + CP + c3W * (i + 1), hy + 52);
      ctx.stroke();
    }
  });
  hy += 62;

  // Progress bar
  const pbX = heroX + CP, pbW = heroW - CP * 2, pbH = 10;
  progressBar(ctx, pbX, hy, pbW, pbH, pct, C.progBg, C.accentDark, C.accent);

  y = heroY + heroH;

  // ═══════════════════════════════════════════
  // SECTION 3 — METRIC CARDS GRID (2×2)
  // ═══════════════════════════════════════════

  y += 20;
  txt(ctx, 'نظرة سريعة', 16, 700, C.textTer, 'right', R, y + 16);
  y += 34;

  const MGAP = 12;
  const mW = (W - OP * 2 - MGAP) / 2;
  const mH = 98;

  const metrics = [
    {
      label: 'باقي على الزواج',
      value: stats.daysRemaining !== null ? String(Math.abs(stats.daysRemaining)) : '—',
      unit:  stats.daysRemaining !== null
        ? (stats.daysRemaining >= 0 ? 'يوم متبقي' : 'يوم مضى')
        : 'لم تُحدَّد التاريخ',
    },
    {
      label: 'إنجاز الخطة',
      value: totalItems > 0 ? `${paidItems} / ${totalItems}` : '—',
      unit:  totalItems > 0 ? 'بند منجز' : 'لا يوجد بنود',
    },
    {
      label: 'المساهمات',
      value: stats.totalSupportReceived > 0 ? formatCurrency(stats.totalSupportReceived) : '—',
      unit:  stats.totalSupportReceived > 0 ? 'مُستلمة' : 'لا توجد مساهمات',
    },
    {
      label: 'احتياطي الطوارئ',
      value: stats.emergencyReserve > 0 ? formatCurrency(stats.emergencyReserve) : '—',
      unit:  stats.emergencyReserve > 0 ? 'مُخصَّص' : 'غير مُحدَّد',
    },
  ];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx = OP + col * (mW + MGAP);
    const my = y + row * (mH + MGAP);
    const m = metrics[i];

    card(ctx, mx, my, mW, mH, 18, C.card, C.cardBorder, C.cardShadow);

    const mIP = 20;
    txt(ctx, m.label, 16, 600, C.textTer,  'right', mx + mW - mIP, my + mIP + 14);
    txt(ctx, m.value, 26, 800, C.textPri,  'right', mx + mW - mIP, my + mIP + 46);
    txt(ctx, m.unit,  14, 400, C.textSec,  'right', mx + mW - mIP, my + mIP + 68);
  }

  y += mH * 2 + MGAP;

  // ═══════════════════════════════════════════
  // SECTION 4 — TOP PLANNING ITEMS
  // ═══════════════════════════════════════════

  y += 20;
  txt(ctx, 'أبرز البنود', 16, 700, C.textTer, 'right', R, y + 16);
  y += 34;

  if (topCats.length === 0) {
    card(ctx, OP, y, W - OP * 2, 82, 18, C.card, C.cardBorder, C.cardShadow);
    txt(ctx, 'ابدأ بإضافة أول بند في خطة الزواج', 20, 500, C.textSec, 'center', W / 2, y + 46);
    y += 82;
  } else {
    const IGAP = 12;
    const IH = 110;

    for (const cat of topCats) {
      const catPct = cat.total > 0 ? Math.min(100, (cat.paid / cat.total) * 100) : 0;
      const catRem = Math.max(0, cat.total - cat.paid);

      card(ctx, OP, y, W - OP * 2, IH, 18, C.card, C.cardBorder, C.cardShadow);

      const iIP = 26;
      const iR = W - OP - iIP;
      const iL = OP + iIP;

      // Category name (right) + remaining (left accent)
      txt(ctx, cat.name,               26, 700, C.textPri, 'right', iR, y + iIP + 20);
      txt(ctx, formatCurrency(catRem), 22, 700, C.accent,  'left',  iL, y + iIP + 20);

      // Sub-row: planned and paid
      txt(ctx, `المخطط: ${formatCurrency(cat.total)}`, 16, 500, C.textSec, 'right', iR, y + iIP + 48);
      txt(ctx, `المصروف: ${formatCurrency(cat.paid)}`, 16, 500, C.textSec, 'left',  iL, y + iIP + 48);

      // Mini progress bar
      const pbY = y + IH - iIP - 2;
      progressBar(ctx, iL, pbY, W - OP * 2 - iIP * 2, 5, catPct, C.progBg, C.accentDark, C.accent);

      y += IH + IGAP;
    }
  }

  // ═══════════════════════════════════════════
  // SECTION 5 — FOOTER
  // ═══════════════════════════════════════════

  const footerY = H - 92;

  ctx.strokeStyle = C.sep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L, footerY);
  ctx.lineTo(R, footerY);
  ctx.stroke();

  txt(ctx, 'تم إنشاء هذا الملخص بـ احسبها صح', 18, 600, C.accent,   'center', W / 2, footerY + 28);
  txt(ctx, 'بياناتك محفوظة على جهازك فقط  ·  مجاني بالكامل', 15, 400, C.textTer, 'center', W / 2, footerY + 54);

  // URL (LTR)
  txt(ctx, 'ehsebha-sah.pages.dev', 14, 400, C.textTer, 'center', W / 2, footerY + 76, 'ltr');

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png'),
  );
}

import { formatCurrency } from './formatting';
import type { BudgetStats } from '../types';

export interface ShareTopCat {
  name: string;
  total: number;
  paid: number;
}

// ─── Primitive helpers ─────────────────────────────────────────────────────

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const s = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + s, y); ctx.lineTo(x + w - s, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + s);
  ctx.lineTo(x + w, y + h - s);
  ctx.quadraticCurveTo(x + w, y + h, x + w - s, y + h);
  ctx.lineTo(x + s, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - s);
  ctx.lineTo(x, y + s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.closePath();
}

function pgBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, pct: number,
  bg: string, ca: string, cb: string,
) {
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(pct > 0 ? h : 0, Math.min(w * pct / 100, w));
  if (fw > 0) {
    const g = ctx.createLinearGradient(x, 0, x + fw, 0);
    g.addColorStop(0, ca); g.addColorStop(1, cb);
    ctx.fillStyle = g;
    rr(ctx, x, y, fw, h, h / 2);
    ctx.fill();
  }
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill: string, border: string, shadow: string,
) {
  ctx.shadowColor = shadow; ctx.shadowBlur = 18; ctx.shadowOffsetY = 5;
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
  ctx.strokeStyle = border; ctx.lineWidth = 1;
  rr(ctx, x, y, w, h, r);
  ctx.stroke();
}

function goldBarTop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  ca: string, cm: string, cb: string,
) {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, ca); g.addColorStop(0.55, cm); g.addColorStop(1, cb);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, 5);
  ctx.restore();
}

/** Draw Arabic/RTL text. y = baseline. */
function t(
  ctx: CanvasRenderingContext2D,
  text: string, sz: number, wt: number, color: string,
  align: 'right' | 'left' | 'center', x: number, y: number, dir: 'rtl' | 'ltr' = 'rtl',
) {
  ctx.font = `${wt} ${sz}px "Cairo", system-ui, -apple-system, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.direction = dir;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

/**
 * Draw a currency / numeric string with LTR direction to prevent Unicode
 * bidi reordering of "د.إ" + digits in RTL canvas context.
 */
function amt(
  ctx: CanvasRenderingContext2D,
  text: string, sz: number, wt: number, color: string,
  align: 'right' | 'left' | 'center', x: number, y: number,
) {
  ctx.font = `${wt} ${sz}px "Cairo", system-ui, -apple-system, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.direction = 'ltr';
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function sepLine(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
}

function vSep(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
}

// ─── Main ──────────────────────────────────────────────────────────────────

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
      document.fonts.load('800 68px Cairo'),
      document.fonts.load('700 34px Cairo'),
      document.fonts.load('600 22px Cairo'),
      document.fonts.load('400 18px Cairo'),
    ]);
  } catch { /* use fallback */ }

  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const D = isDark;

  // ── Palette ───────────────────────────────────────────────────────────────
  const C = {
    bg:     D ? '#0D0D0A' : '#EDE6DB',
    bgB:    D ? '#171713' : '#E3DACE',
    card:   D ? '#252320' : '#FFFFFF',
    cardBd: D ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.08)',
    cardSh: D ? 'rgba(0,0,0,0.65)'       : 'rgba(0,0,0,0.11)',
    // Primary text: near-white / deep navy
    pri:    D ? '#F0EFE8' : '#111827',
    // Secondary text: readable on dark cards (was too dim at #9C9C94)
    sec:    D ? '#B4B3AC' : '#5C5C58',
    // Tertiary / muted labels (was too dim at #6A6A62)
    ter:    D ? '#8E8D88' : '#9A9A98',
    acc:    D ? '#D4A240' : '#C99368',
    accDk:  '#A87248',
    accFd:  D ? 'rgba(212,162,64,0.18)' : '#F5E3D0',
    sep:    D ? 'rgba(255,255,255,0.13)' : '#DDD5C8',
    pgBg:   D ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
  };

  const SK_CLR: Record<string, string> = {
    comfortable: '#2FAE72', balanced: C.acc, attention: '#E67E22', exceeded: '#E74C3C',
  };
  const SK_BG: Record<string, string> = {
    comfortable: D ? 'rgba(47,174,114,0.20)'  : '#D4F4E5',
    balanced:    C.accFd,
    attention:   D ? 'rgba(230,126,34,0.20)'  : '#FDEBD0',
    exceeded:    D ? 'rgba(231,76,60,0.20)'   : '#FADBD8',
  };
  const SK_LBL: Record<string, string> = {
    comfortable: 'مريح', balanced: 'متوازن', attention: 'يحتاج انتباه', exceeded: 'تجاوز الميزانية',
  };

  // ── Background ────────────────────────────────────────────────────────────
  const bgG = ctx.createLinearGradient(0, 0, 0, H);
  bgG.addColorStop(0, C.bg); bgG.addColorStop(1, C.bgB);
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

  const radG = ctx.createRadialGradient(W / 2, 0, 60, W / 2, 0, 440);
  radG.addColorStop(0, D ? 'rgba(212,162,64,0.09)' : 'rgba(201,147,104,0.14)');
  radG.addColorStop(1, 'transparent');
  ctx.fillStyle = radG; ctx.fillRect(0, 0, W, H);

  // ── Layout constants ──────────────────────────────────────────────────────
  const OP = 56;   // outer canvas margin
  const CP = 44;   // card inner horizontal padding
  const R  = W - OP - CP;   // right text anchor (inside card)
  const L  = OP + CP;       // left  text anchor (inside card)
  const CW = R - L;         // usable inner width

  const pct = Math.min(100, Math.round(stats.spentPercentage));
  const sk  = stats.comfortLevel;

  // y = top of the next element to draw
  let y = 60;

  // ══════════════════════════════════════════════
  // 1. HEADER
  // ══════════════════════════════════════════════

  // Decorative ring + center dot
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = C.acc; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(W / 2, y + 14, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.acc;
  ctx.beginPath(); ctx.arc(W / 2, y + 14, 5, 0, Math.PI * 2); ctx.fill();
  y += 38; // clear ring

  // App name — 52px bold (Cairo ascent ≈ 0.81 × sz ≈ 42)
  t(ctx, 'احسبها صح', 52, 800, C.acc, 'center', W / 2, y + 42);
  y += 60;

  // Subtitle — 26px medium (ascent ≈ 21)
  t(ctx, 'ملخص خطة الزواج', 26, 500, C.sec, 'center', W / 2, y + 21);
  y += 36;

  // Plan title — 34px bold (ascent ≈ 27)
  t(ctx, `خطة زواج ${name}`, 34, 700, C.pri, 'center', W / 2, y + 27);
  y += 46;

  // ══════════════════════════════════════════════
  // 2. BUDGET HERO CARD
  // ══════════════════════════════════════════════

  y += 30;
  const heroX = OP, heroY = y, heroW = W - OP * 2, heroH = 326;

  drawCard(ctx, heroX, heroY, heroW, heroH, 22, C.card, C.cardBd, C.cardSh);
  goldBarTop(ctx, heroX, heroY, heroW, heroH, 22, C.accDk, C.acc, D ? 'rgba(212,162,64,0.22)' : '#F5E3D0');

  // hy = distance from heroY top to the current drawing row
  let hy = 38;

  // ── Row A: status pill (left) + remaining label (right) — same baseline ──

  const sLbl = SK_LBL[sk] ?? 'متوازن';
  const sClr = SK_CLR[sk] ?? C.acc;
  const sBg  = SK_BG[sk]  ?? C.accFd;

  // Status pill
  ctx.font = `700 16px "Cairo", system-ui, Arial, sans-serif`;
  const sTW = ctx.measureText(sLbl).width;
  const sPadX = 18, sPillH = 30, sPillW = sTW + sPadX * 2;
  const sPillX = heroX + CP;
  const sPillY = heroY + hy;
  ctx.fillStyle = sBg; rr(ctx, sPillX, sPillY, sPillW, sPillH, sPillH / 2); ctx.fill();
  ctx.strokeStyle = sClr; ctx.lineWidth = 1.2;
  rr(ctx, sPillX, sPillY, sPillW, sPillH, sPillH / 2); ctx.stroke();
  t(ctx, sLbl, 16, 700, sClr, 'center', sPillX + sPillW / 2, heroY + hy + 21);

  // Remaining label — right side, aligned with pill center
  t(ctx, 'المتبقي من الميزانية', 19, 500, C.sec, 'right', heroX + heroW - CP, heroY + hy + 21);
  hy += 46; // clear pill row + gap

  // ── Row B: big remaining value (68px) ────────────────────────────────────
  // ascent ≈ 55px — ensure enough clearance from Row A
  amt(ctx, formatCurrency(Math.max(0, stats.remaining)), 68, 800, C.pri,
    'right', heroX + heroW - CP, heroY + hy + 55);
  hy += 76; // 68 + descenders

  // ── Divider ───────────────────────────────────────────────────────────────
  hy += 14;
  sepLine(ctx, heroX + CP, heroX + heroW - CP, heroY + hy, C.sep);
  hy += 22;

  // ── Row C: 3-column stats ─────────────────────────────────────────────────
  // Columns ordered right-to-left: الميزانية الإجمالية | المصروف | نسبة الصرف
  const colW = CW / 3;
  const statDefs = [
    { lbl: 'نسبة الصرف',           val: `${pct}%`,                        hi: false },
    { lbl: 'المصروف',               val: formatCurrency(stats.totalSpent),  hi: true  },
    { lbl: 'الميزانية الإجمالية',  val: formatCurrency(stats.totalBudget), hi: false },
  ];

  statDefs.forEach((s, i) => {
    const colRA = L + colW * (i + 1) - 10;
    // Values drawn LTR to prevent bidi reordering of currency prefix
    amt(ctx, s.val, 22, 700, s.hi ? C.acc : C.pri, 'right', colRA, heroY + hy + 19);
    // Labels drawn RTL (pure Arabic)
    t(ctx, s.lbl, 16, 400, C.ter, 'right', colRA, heroY + hy + 46);
    if (i < 2) {
      vSep(ctx, L + colW * (i + 1), heroY + hy, heroY + hy + 54, C.sep);
    }
  });
  hy += 58;

  // ── Progress bar (14px tall) ──────────────────────────────────────────────
  hy += 14;
  pgBar(ctx, heroX + CP, heroY + hy, heroW - CP * 2, 14, pct, C.pgBg, C.accDk, C.acc);
  // remaining space to heroH bottom ≈ 326 - (hy + 14) - 38 = safe padding

  y = heroY + heroH;

  // ══════════════════════════════════════════════
  // 3. METRIC CARDS — 2 × 2
  // ══════════════════════════════════════════════

  y += 32;

  // Section label with accent dot
  ctx.fillStyle = C.acc;
  ctx.beginPath(); ctx.arc(R - 5, y + 11, 4, 0, Math.PI * 2); ctx.fill();
  t(ctx, 'نظرة سريعة', 20, 700, C.ter, 'right', R - 18, y + 16);
  y += 34;

  const MGAP = 14;
  const mW   = (W - OP * 2 - MGAP) / 2;
  const mH   = 120;
  const mIP  = 24;

  const metrics = [
    {
      lbl:  'باقي على الزواج',
      val:  stats.daysRemaining !== null ? String(Math.abs(stats.daysRemaining)) : '—',
      unit: stats.daysRemaining !== null
        ? (stats.daysRemaining >= 0 ? 'يوم متبقي' : 'يوم مضى')
        : 'لم تُحدَّد',
      isAmt: false,
    },
    {
      lbl:  'إنجاز الخطة',
      val:  totalItems > 0 ? `${paidItems} / ${totalItems}` : '—',
      unit: totalItems > 0 ? 'بند منجز' : 'لا توجد بنود',
      isAmt: false,
    },
    {
      lbl:  'احتياطي الطوارئ',
      val:  stats.emergencyReserve > 0 ? formatCurrency(stats.emergencyReserve) : '—',
      unit: stats.emergencyReserve > 0 ? 'مُخصَّص' : 'غير محدد',
      isAmt: stats.emergencyReserve > 0,
    },
    {
      lbl:  'المساهمات',
      val:  stats.totalSupportReceived > 0 ? formatCurrency(stats.totalSupportReceived) : '—',
      unit: stats.totalSupportReceived > 0 ? 'مُستلمة' : 'لا توجد مساهمات',
      isAmt: stats.totalSupportReceived > 0,
    },
  ];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx  = OP + col * (mW + MGAP);
    const my  = y + row * (mH + MGAP);
    const m   = metrics[i];

    drawCard(ctx, mx, my, mW, mH, 16, C.card, C.cardBd, C.cardSh);

    const mR = mx + mW - mIP;
    // Label (top)
    t(ctx, m.lbl,  17, 600, C.sec, 'right', mR, my + mIP + 14);
    // Value (middle) — LTR for currency, LTR-number for numerics
    if (m.isAmt) {
      amt(ctx, m.val, 28, 800, C.pri, 'right', mR, my + mIP + 52);
    } else {
      t(ctx, m.val, 28, 800, C.pri, 'right', mR, my + mIP + 52, 'ltr');
    }
    // Unit (bottom)
    t(ctx, m.unit, 16, 400, C.sec, 'right', mR, my + mIP + 84);
  }

  y += mH * 2 + MGAP;

  // ══════════════════════════════════════════════
  // 4. TOP PLANNING ITEMS
  // ══════════════════════════════════════════════

  y += 28;

  // Section label
  ctx.fillStyle = C.acc;
  ctx.beginPath(); ctx.arc(R - 5, y + 11, 4, 0, Math.PI * 2); ctx.fill();
  t(ctx, 'أبرز البنود', 20, 700, C.ter, 'right', R - 18, y + 16);
  y += 34;

  if (topCats.length === 0) {
    // Refined empty state card
    const eH = 100;
    drawCard(ctx, OP, y, W - OP * 2, eH, 16, C.card, C.cardBd, C.cardSh);
    const ecy = y + eH / 2;
    // Small decorative mark
    t(ctx, '✦', 16, 400, C.ter, 'center', W / 2, ecy - 12);
    t(ctx, 'ابدأ بإضافة أول بند في خطة الزواج', 21, 500, C.sec, 'center', W / 2, ecy + 18);
    y += eH;
  } else {
    const IH   = 84;
    const IGAP = 9;
    const iIP  = 26;

    for (let ci = 0; ci < topCats.length; ci++) {
      const cat    = topCats[ci];
      const catPct = cat.total > 0 ? Math.min(100, (cat.paid / cat.total) * 100) : 0;
      const catRem = Math.max(0, cat.total - cat.paid);

      drawCard(ctx, OP, y, W - OP * 2, IH, 16, C.card, C.cardBd, C.cardSh);

      const iR = W - OP - iIP;
      const iL = OP + iIP;

      // Row 1: category name (right) + remaining (left, accent)
      t(ctx,   cat.name,               21, 700, C.pri, 'right', iR, y + iIP + 17);
      amt(ctx, formatCurrency(catRem), 19, 700, C.acc, 'left',  iL, y + iIP + 17);

      // Row 2: planned | paid (15px muted)
      t(ctx, `مخطط: ${formatCurrency(cat.total)}`, 14, 500, C.ter, 'right', iR, y + iIP + 40);
      t(ctx, `مصروف: ${formatCurrency(cat.paid)}`, 14, 500, C.ter, 'left',  iL, y + iIP + 40);

      // Mini progress bar — 6px, 12px from bottom
      const pbY = y + IH - 12 - 6;
      pgBar(ctx, iL, pbY, W - OP * 2 - iIP * 2, 6, catPct, C.pgBg, C.accDk, C.acc);

      y += IH + (ci < topCats.length - 1 ? IGAP : 0);
    }
  }

  // ══════════════════════════════════════════════
  // 5. FOOTER
  // ══════════════════════════════════════════════

  // Always sit at least 48px above canvas bottom; push down only if content fits
  const footerY = Math.max(y + 32, H - 120);

  sepLine(ctx, L, R, footerY, C.sep);

  // Line 1: app attribution
  t(ctx, 'تم إنشاء هذا الملخص من احسبها صح', 19, 600, C.acc,  'center', W / 2, footerY + 30);
  // Line 2: privacy notice
  t(ctx, 'بياناتك محفوظة على جهازك فقط',     17, 400, C.sec,  'center', W / 2, footerY + 60);
  // Line 3: URL (LTR)
  t(ctx, 'ehsebha-sah.pages.dev',              15, 400, C.ter,  'center', W / 2, footerY + 86, 'ltr');

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png'),
  );
}

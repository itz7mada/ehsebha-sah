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
  g.addColorStop(0, ca); g.addColorStop(0.45, cm); g.addColorStop(0.75, cm); g.addColorStop(1, cb);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, 7); // 7px premium bar (was 5px)
  ctx.restore();
}

/** Draw a small gold diamond ornament centered at (cx, cy). */
function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.6, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.6, cy);
  ctx.closePath();
  ctx.fill();
}

/**
 * Glowing progress bar — RTL: track is full width, fill is anchored to the
 * physical RIGHT edge and grows toward the LEFT (correct for Arabic UI).
 * The glow tip sits at the LEFT end of the fill (its leading edge).
 */
function pgBarGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, pct: number,
  bg: string, ca: string, cb: string,
) {
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(pct > 0 ? h : 0, Math.min(w * pct / 100, w));
  if (fw > 0) {
    // Anchor fill to the right edge: fillX = x + w - fw
    const fx = x + w - fw;
    // Gradient runs right→left: solid (cb) at the right edge, darker (ca) at the left tip
    const g = ctx.createLinearGradient(x + w, 0, fx, 0);
    g.addColorStop(0, cb); g.addColorStop(0.3, cb); g.addColorStop(1, ca);
    ctx.fillStyle = g;
    rr(ctx, fx, y, fw, h, h / 2);
    ctx.fill();
    // Subtle glow tip at the LEFT (leading) end of the fill
    if (fw < w - 4) {
      ctx.save();
      ctx.shadowColor = cb; ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(255,220,120,0.55)';
      ctx.beginPath();
      ctx.arc(fx, y + h / 2, h / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
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
    bg:     D ? '#0C0C09' : '#EDE6DB',
    bgB:    D ? '#181714' : '#E3DACE',
    card:   D ? '#242220' : '#FFFFFF',
    cardBd: D ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
    cardSh: D ? 'rgba(0,0,0,0.70)'       : 'rgba(0,0,0,0.12)',
    // Primary text
    pri:    D ? '#F2F1EA' : '#111827',
    // Secondary — warm and readable
    sec:    D ? '#B8B7B0' : '#4A4A46',
    // Tertiary / muted
    ter:    D ? '#908F8A' : '#8A8A86',
    // Gold accent — warm amber
    acc:    D ? '#D6A642' : '#C99368',
    accB:   D ? '#E8BE6A' : '#D4A870',  // lighter gold for highlights
    accDk:  '#9C6A38',
    accFd:  D ? 'rgba(214,166,66,0.16)' : '#F5E3D0',
    sep:    D ? 'rgba(255,255,255,0.11)' : '#DDD5C8',
    pgBg:   D ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
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
  bgG.addColorStop(0, C.bg); bgG.addColorStop(0.6, C.bg); bgG.addColorStop(1, C.bgB);
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

  // Top-center warm glow (header area)
  const radTop = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, 480);
  radTop.addColorStop(0, D ? 'rgba(214,166,66,0.12)' : 'rgba(201,147,104,0.18)');
  radTop.addColorStop(1, 'transparent');
  ctx.fillStyle = radTop; ctx.fillRect(0, 0, W, H);

  // Bottom-left warm depth glow (premium depth layer)
  const radBL = ctx.createRadialGradient(0, H, 0, 0, H, 600);
  radBL.addColorStop(0, D ? 'rgba(180,130,50,0.07)' : 'rgba(190,140,90,0.10)');
  radBL.addColorStop(1, 'transparent');
  ctx.fillStyle = radBL; ctx.fillRect(0, 0, W, H);

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

  // Premium header ornament: three small diamonds in a row
  const dY = y + 14;
  diamond(ctx, W / 2,      dY, 5.5, C.acc);
  ctx.globalAlpha = 0.50;
  diamond(ctx, W / 2 - 20, dY, 3.5, C.acc);
  diamond(ctx, W / 2 + 20, dY, 3.5, C.acc);
  ctx.globalAlpha = 1;
  y += 38;

  // App name — 54px bold, gold with subtle glow
  ctx.save();
  ctx.shadowColor = D ? 'rgba(214,166,66,0.35)' : 'rgba(180,120,60,0.20)';
  ctx.shadowBlur  = 18;
  t(ctx, 'احسبها صح', 54, 800, C.acc, 'center', W / 2, y + 44);
  ctx.restore();
  y += 62;

  // Subtitle — 26px medium
  t(ctx, 'ملخص خطة الزواج', 26, 500, C.sec, 'center', W / 2, y + 21);
  y += 36;

  // Plan title — 34px bold
  t(ctx, `خطة زواج ${name}`, 34, 700, C.pri, 'center', W / 2, y + 27);
  y += 46;

  // ══════════════════════════════════════════════
  // 2. BUDGET HERO CARD
  // ══════════════════════════════════════════════

  y += 30;
  const heroX = OP, heroY = y, heroW = W - OP * 2, heroH = 326;

  drawCard(ctx, heroX, heroY, heroW, heroH, 22, C.card, C.cardBd, C.cardSh);
  goldBarTop(ctx, heroX, heroY, heroW, heroH, 22, C.accDk, C.acc, D ? 'rgba(214,166,66,0.28)' : '#F5E3D0');

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

  // ── Row B: big remaining value (72px) — with text glow ──────────────────
  ctx.save();
  ctx.shadowColor = D ? 'rgba(214,166,66,0.22)' : 'rgba(180,120,60,0.15)';
  ctx.shadowBlur  = 14;
  amt(ctx, formatCurrency(Math.max(0, stats.remaining)), 72, 800, C.pri,
    'right', heroX + heroW - CP, heroY + hy + 58);
  ctx.restore();
  hy += 80; // 72px + descenders

  // ── Divider with center diamond ──────────────────────────────────────────
  hy += 12;
  const divY = heroY + hy;
  const divMid = heroX + heroW / 2;
  sepLine(ctx, heroX + CP, divMid - 18, divY, C.sep);
  diamond(ctx, divMid, divY, 4, C.acc);
  sepLine(ctx, divMid + 18, heroX + heroW - CP, divY, C.sep);
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

  // ── Progress bar (14px, with glow tip) ───────────────────────────────────
  hy += 14;
  pgBarGlow(ctx, heroX + CP, heroY + hy, heroW - CP * 2, 14, pct, C.pgBg, C.accDk, C.acc);
  // remaining space to heroH bottom ≈ 326 - (hy + 14) - 38 = safe padding

  y = heroY + heroH;

  // ══════════════════════════════════════════════
  // 3. METRIC CARDS — 2 × 2
  // ══════════════════════════════════════════════

  y += 30;

  // Section label with diamond ornament
  diamond(ctx, R - 6, y + 12, 4.5, C.acc);
  t(ctx, 'نظرة سريعة', 22, 700, C.sec, 'right', R - 20, y + 18);
  y += 36;

  const MGAP = 14;
  const mW   = (W - OP * 2 - MGAP) / 2;
  const mH   = 104;   // taller enough for 3 lines without crowding

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

    const mR = mx + mW - 20;
    // Label — top, readable (baseline my+36)
    t(ctx, m.lbl, 18, 600, C.sec, 'right', mR, my + 36);
    // Value — prominent (baseline my+68)
    if (m.isAmt) {
      amt(ctx, m.val, 26, 800, C.pri, 'right', mR, my + 68);
    } else {
      t(ctx, m.val, 26, 800, C.pri, 'right', mR, my + 68, 'ltr');
    }
    // Unit — sub-label (baseline my+91, bottom my+95, card my+104 → 9px margin)
    t(ctx, m.unit, 15, 400, C.sec, 'right', mR, my + 91);
  }

  y += mH * 2 + MGAP;

  // ══════════════════════════════════════════════
  // 4. TOP PLANNING ITEMS
  // ══════════════════════════════════════════════

  y += 26;

  // Section label with diamond ornament
  diamond(ctx, R - 6, y + 12, 4.5, C.acc);
  t(ctx, 'أبرز البنود', 22, 700, C.sec, 'right', R - 20, y + 18);
  y += 36;

  if (topCats.length === 0) {
    const eH = 96;
    drawCard(ctx, OP, y, W - OP * 2, eH, 16, C.card, C.cardBd, C.cardSh);
    t(ctx, '✦', 16, 400, C.ter, 'center', W / 2, y + eH / 2 - 10);
    t(ctx, 'ابدأ بإضافة أول بند في خطة الزواج', 21, 500, C.sec, 'center', W / 2, y + eH / 2 + 18);
    y += eH;
  } else {
    // IH=96 gives clear text → gap → progress bar with no overlap.
    // Layout per row (positions relative to card top y):
    //   Row 1 (name right / remaining left): baseline y+43 (26px/22px)
    //   Row 2 (planned right / paid left):   baseline y+67 (15px muted)
    //   Progress bar:                         top y+82, height 8px, bottom y+90
    //   Card bottom: y+96 — 6px below bar ✓
    const IH   = 96;
    const IGAP = 10;
    const iIP  = 20;   // inner horizontal padding

    for (let ci = 0; ci < topCats.length; ci++) {
      const cat    = topCats[ci];
      const catPct = cat.total > 0 ? Math.min(100, (cat.paid / cat.total) * 100) : 0;
      const catRem = Math.max(0, cat.total - cat.paid);

      drawCard(ctx, OP, y, W - OP * 2, IH, 16, C.card, C.cardBd, C.cardSh);

      const iR = W - OP - iIP;
      const iL = OP + iIP;

      // Row 1: name (right, 26px bold) + remaining value (left, 22px gold)
      t(ctx,   cat.name,                26, 700, C.pri, 'right', iR, y + 43);
      amt(ctx, formatCurrency(catRem),  22, 700, C.acc, 'left',  iL, y + 43);

      // Row 2: planned (right, 15px muted) + paid (left, 15px muted)
      // Row 2 top ≈ y+53, clear 10px gap from Row 1 bottom (y+49)
      t(ctx, `المخطط: ${formatCurrency(cat.total)}`, 15, 500, C.ter, 'right', iR, y + 67);
      t(ctx, `المصروف: ${formatCurrency(cat.paid)}`,  15, 500, C.ter, 'left',  iL, y + 67);

      // Progress bar — positioned well below all text (Row 2 bottom ≈ y+71, gap=11px)
      pgBarGlow(ctx, iL, y + 82, W - OP * 2 - iIP * 2, 8, catPct, C.pgBg, C.accDk, C.acc);

      y += IH + (ci < topCats.length - 1 ? IGAP : 0);
    }
  }

  // ══════════════════════════════════════════════
  // 5. FOOTER
  // ══════════════════════════════════════════════

  // footerY sits at least H-112 from canvas top, never clips with content above
  const footerY = Math.max(y + 24, H - 112);

  sepLine(ctx, L, R, footerY, C.sep);

  // Line 1: app attribution
  t(ctx, 'تم إنشاء هذا الملخص من احسبها صح', 19, 600, C.acc,  'center', W / 2, footerY + 26);
  // Line 2: privacy notice
  t(ctx, 'بياناتك محفوظة على جهازك فقط',     17, 400, C.sec,  'center', W / 2, footerY + 52);
  // Line 3: URL (LTR) — tighter spacing ensures it stays within canvas
  t(ctx, 'ehsebha-sah.pages.dev',              14, 400, C.ter,  'center', W / 2, footerY + 74, 'ltr');

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png'),
  );
}

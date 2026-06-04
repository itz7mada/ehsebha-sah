import { formatCurrency } from './formatting';
import type { BudgetStats } from '../types';

interface TopCat {
  name: string;
  total: number;
}

// Manual roundRect for cross-browser safety
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Rounded rect with independent radii for top corners only
function roundRectTop(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateShareImage(
  name: string,
  stats: BudgetStats,
  topCats: TopCat[],
): Promise<Blob> {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // Pre-load Cairo at the weights we need
  try {
    await Promise.all([
      document.fonts.load('800 60px Cairo'),
      document.fonts.load('700 28px Cairo'),
      document.fonts.load('500 26px Cairo'),
      document.fonts.load('400 22px Cairo'),
    ]);
  } catch { /* continue with fallback font */ }

  const W = 1080;
  const H = 1350; // 4:5 — works on all apps
  const PAD = 48;   // outer margin (bg peek)
  const IP = 60;    // inner padding (content from card edges)
  const RADIUS = 36;

  const C = isDark ? {
    bg: '#0A0A09',
    card: '#1A1A17',
    border: 'rgba(255,255,255,0.07)',
    textPrimary: '#F5F5F0',
    textSecondary: '#A8A8A3',
    textTertiary: '#55554F',
    accent: '#D4A240',
    accentDark: '#A87248',
    accentFade: 'rgba(212,162,64,0.08)',
    sep: 'rgba(255,255,255,0.06)',
  } : {
    bg: '#EDE7DE',
    card: '#FFFFFF',
    border: 'rgba(0,0,0,0.06)',
    textPrimary: '#111827',
    textSecondary: '#6B6B67',
    textTertiary: '#A8A8A3',
    accent: '#C99368',
    accentDark: '#A87248',
    accentFade: '#F5E3D0',
    sep: '#EEE7DF',
  };

  const f = (size: number, weight: number) =>
    `${weight} ${size}px "Cairo", system-ui, -apple-system, Arial, sans-serif`;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Background ───────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow behind card (premium depth)
  const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.8);
  glow.addColorStop(0, isDark ? 'rgba(212,162,64,0.04)' : 'rgba(201,147,104,0.08)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Card shadow (fake, paint a blurred dark rect behind) ─────
  ctx.shadowColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.16)';
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 12;

  // ── Card body ────────────────────────────────────────────────
  roundRect(ctx, PAD, PAD, W - PAD * 2, H - PAD * 2, RADIUS);
  ctx.fillStyle = C.card;
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Subtle card border
  roundRect(ctx, PAD, PAD, W - PAD * 2, H - PAD * 2, RADIUS);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Gold gradient accent bar ──────────────────────────────────
  const barH = 5;
  const barGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  barGrad.addColorStop(0, C.accentDark);
  barGrad.addColorStop(0.55, C.accent);
  barGrad.addColorStop(1, isDark ? 'rgba(212,162,64,0.3)' : '#F5E3D0');
  ctx.fillStyle = barGrad;
  roundRectTop(ctx, PAD, PAD, W - PAD * 2, barH, RADIUS);
  ctx.fill();

  // ── Content coordinates ───────────────────────────────────────
  const CL = PAD + IP;   // left content edge
  const CR = W - PAD - IP; // right content edge

  let y = PAD + barH + IP + 12;

  // ── App mark ─────────────────────────────────────────────────
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.font = f(21, 700);
  ctx.fillStyle = C.accent;
  ctx.fillText('احسبها صح', CR, y);
  y += 52;

  // ── Name ─────────────────────────────────────────────────────
  ctx.font = f(58, 800);
  ctx.fillStyle = C.textPrimary;
  ctx.fillText(`خطة زواج ${name}`, CR, y);
  y += 36;

  // ── Divider ───────────────────────────────────────────────────
  y += 20;
  ctx.strokeStyle = C.sep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CL, y);
  ctx.lineTo(CR, y);
  ctx.stroke();
  y += 44;

  // ── Stats rows ───────────────────────────────────────────────
  type StatRow = { label: string; value: string; accent?: boolean };
  const rows: StatRow[] = [];

  if (stats.daysRemaining !== null) {
    rows.push({
      label: stats.daysRemaining >= 0 ? 'يوم على الفرح' : 'يوم بعد الفرح',
      value: `${Math.abs(stats.daysRemaining)} يوم`,
      accent: true,
    });
  }
  rows.push({ label: 'الميزانية الإجمالية', value: formatCurrency(stats.totalBudget) });
  const pct = Math.round(stats.spentPercentage);
  rows.push({ label: 'المنجز', value: `${formatCurrency(stats.totalSpent)} · ${pct}%` });
  rows.push({ label: 'المتبقي', value: formatCurrency(Math.max(0, stats.remaining)) });

  const ROW_H = 54;
  for (const row of rows) {
    ctx.font = f(26, 500);
    ctx.fillStyle = C.textSecondary;
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillText(row.label, CR, y);

    ctx.font = f(26, 700);
    ctx.fillStyle = row.accent ? C.accent : C.textPrimary;
    ctx.direction = 'rtl';
    ctx.textAlign = 'left';
    ctx.fillText(row.value, CL, y);

    y += ROW_H;
  }

  // ── Categories ───────────────────────────────────────────────
  if (topCats.length > 0) {
    y += 16;
    ctx.strokeStyle = C.sep;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CL, y);
    ctx.lineTo(CR, y);
    ctx.stroke();
    y += 42;

    ctx.font = f(20, 700);
    ctx.fillStyle = C.textTertiary;
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillText('أبرز البنود', CR, y);
    y += 44;

    for (const cat of topCats) {
      // Accent dot
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.arc(CR - 5, y - 10, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = f(25, 500);
      ctx.fillStyle = C.textPrimary;
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.fillText(cat.name, CR - 20, y);

      ctx.font = f(25, 700);
      ctx.fillStyle = C.textPrimary;
      ctx.direction = 'rtl';
      ctx.textAlign = 'left';
      ctx.fillText(formatCurrency(cat.total), CL, y);

      y += 50;
    }
  }

  // ── Watermark ─────────────────────────────────────────────────
  const watermarkY = H - PAD - IP + 10;

  ctx.strokeStyle = C.sep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CL, watermarkY - 36);
  ctx.lineTo(CR, watermarkY - 36);
  ctx.stroke();

  ctx.font = f(22, 700);
  ctx.fillStyle = C.accent;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillText('✨ احسبها صح', CR, watermarkY);

  ctx.font = f(22, 400);
  ctx.fillStyle = C.textTertiary;
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.fillText('ehsebha-sah.pages.dev', CL, watermarkY);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png'),
  );
}

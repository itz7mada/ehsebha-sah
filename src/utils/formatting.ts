import { formatDistanceToNow, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `د.إ ${formatted}`;
}

export function formatCurrencyPlain(amount: number): string {
  return formatCurrency(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateArabic(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: ar });
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(weddingDate: string): number | null {
  try {
    // Calendar-day difference (start-of-day to start-of-day) so "tomorrow" = 1,
    // not 0 — avoids the <24h truncation of differenceInDays. parseISO yields a
    // local date at 00:00; differenceInCalendarDays ignores time-of-day.
    const date = parseISO(weddingDate);
    if (isNaN(date.getTime())) return null;
    return differenceInCalendarDays(date, new Date());
  } catch {
    return null;
  }
}

export function getRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: ar });
  } catch {
    return '';
  }
}

export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06F0));
}

/**
 * Normalize an Arabic name for safe comparison (e.g. dedup suggestions vs added items):
 * trims, collapses repeated spaces, unifies alef/ya/ta-marbuta variants, strips diacritics.
 */
export function normalizeArabicName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[أإآ]/g, 'ا') // أ إ آ -> ا
    .replace(/ى/g, 'ي')               // ى -> ي
    .replace(/ة/g, 'ه')               // ة -> ه
    .replace(/[ً-ْـ]/g, '');      // diacritics + tatweel
}

export function parseCurrencyInput(value: string): number {
  const cleaned = normalizeDigits(value).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatPercentage(value: number): string {
  return `${Math.min(100, Math.round(value))}%`;
}

export function getDaysLabel(days: number): string {
  if (days < 0) return `مضى ${Math.abs(days)} يوم`;
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غدًا';
  if (days <= 10) return `بعد ${days} أيام`;
  return `بعد ${days} يومًا`;
}

export type CountdownTone = 'normal' | 'soon' | 'today' | 'past' | 'none';

export interface WeddingCountdown {
  /** Context label for the card heading (e.g. "موعد الزواج", "موعدكم يقترب"). */
  label: string;
  /** Hero value shown once (e.g. "165", "اليوم", "تم", "—"). */
  value: string;
  /** Short supporting line — never repeats the label's meaning. */
  sub: string;
  tone: CountdownTone;
}

/** Countdown display for the wedding day — the number is the hero, no repetition. */
export function getWeddingCountdown(days: number | null): WeddingCountdown {
  if (days === null) return { label: 'موعد الزواج', value: '—', sub: 'حدّد التاريخ', tone: 'none' };
  if (days < 0) return { label: 'تم الزواج', value: 'تم', sub: 'الله يتمم لكم بالخير', tone: 'past' };
  if (days === 0) return { label: 'موعد الزواج', value: 'اليوم', sub: 'الله يتمم لكم بالخير', tone: 'today' };
  if (days <= 30) return { label: 'موعدكم يقترب', value: String(days), sub: 'يوم متبقّي', tone: 'soon' };
  return { label: 'موعد الزواج', value: String(days), sub: 'يوم متبقّي', tone: 'normal' };
}

export function maskAmount(amount: number, hide: boolean): string {
  return hide ? '••••' : formatCurrency(amount);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function now(): string {
  return new Date().toISOString();
}

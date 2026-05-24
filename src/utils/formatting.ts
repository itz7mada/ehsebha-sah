import { formatDistanceToNow, differenceInDays, format, parseISO } from 'date-fns';
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
    const date = parseISO(weddingDate);
    const days = differenceInDays(date, new Date());
    return days;
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

export function maskAmount(amount: number, hide: boolean): string {
  return hide ? '••••' : formatCurrency(amount);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function now(): string {
  return new Date().toISOString();
}

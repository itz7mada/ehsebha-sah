import type { BackupData } from '../types';

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'الاسم مطلوب';
  if (trimmed.length < 2) return 'الاسم قصير جدًا';
  if (trimmed.length > 50) return 'الاسم طويل جدًا';
  return null;
}

export function validateBudget(value: number): string | null {
  if (isNaN(value) || value < 1) return 'حط ميزانية أكبر من 0';
  if (value > 100_000_000) return 'المبلغ كبير جدًا';
  return null;
}

export function validateAmount(value: number): string | null {
  if (isNaN(value) || value < 0) return 'يرجى إدخال مبلغ صحيح';
  if (value > 100_000_000) return 'المبلغ كبير جدًا';
  return null;
}

export function validateExpenseName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'اسم البند مطلوب';
  if (trimmed.length > 100) return 'الاسم طويل جدًا';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\s/g, '');
  if (!/^[0-9+\-()]{7,20}$/.test(cleaned)) return 'رقم الهاتف غير صحيح';
  return null;
}

export function sanitizeText(input: string): string {
  return input.trim().replace(/[<>&"']/g, (char) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return map[char] || char;
  });
}

export function validateBackupFile(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.version !== 'string') return false;
  if (typeof d.exportedAt !== 'string') return false;
  if (!d.settings || typeof d.settings !== 'object') return false;
  if (!Array.isArray(d.categories)) return false;
  if (!Array.isArray(d.expenses)) return false;
  if (!Array.isArray(d.support)) return false;
  if (!Array.isArray(d.journey)) return false;

  // Array length limits
  if (d.categories.length > 50) return false;
  if (d.expenses.length > 500) return false;
  if (d.support.length > 100) return false;
  if (d.journey.length > 2000) return false;

  const s = d.settings as Record<string, unknown>;
  if (s.id !== 'settings') return false;
  if (typeof s.name !== 'string' || s.name.length > 100) return false;
  if (typeof s.budget !== 'number') return false;

  // Category string limits
  for (const cat of d.categories) {
    if (!cat || typeof cat !== 'object') return false;
    const c = cat as Record<string, unknown>;
    if (typeof c.name !== 'string' || c.name.length > 80) return false;
  }

  // Expense string limits
  for (const exp of d.expenses) {
    if (!exp || typeof exp !== 'object') return false;
    const e = exp as Record<string, unknown>;
    if (typeof e.name !== 'string' || e.name.length > 300) return false;
    if (e.notes !== undefined && (typeof e.notes !== 'string' || e.notes.length > 300)) return false;
    if (e.images !== undefined && (!Array.isArray(e.images) || e.images.length > 3)) return false;
  }

  // Support entry string limits
  for (const sup of d.support) {
    if (!sup || typeof sup !== 'object') return false;
    const su = sup as Record<string, unknown>;
    if (typeof su.name !== 'string' || su.name.length > 100) return false;
  }

  return true;
}

/** Local YYYY-MM-DD for date inputs (avoids UTC timezone shift). */
export function getTodayDateInputValue(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Local YYYY-MM-DD for tomorrow — used as the min for future-only dates. */
export function getTomorrowDateInputValue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** True if a YYYY-MM-DD string is strictly before local today. */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  // ISO date strings (YYYY-MM-DD) sort lexicographically == chronologically.
  return dateStr < getTodayDateInputValue();
}

/** True only if a YYYY-MM-DD string is strictly after local today (tomorrow+). */
export function isFutureDateOnly(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr > getTodayDateInputValue();
}

export function validateWeddingDate(dateStr: string): string | null {
  if (!dateStr) return 'اختر تاريخ الزواج';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'التاريخ غير صحيح';
  if (!isFutureDateOnly(dateStr)) return 'تاريخ الزواج لازم يكون بعد اليوم';
  return null;
}

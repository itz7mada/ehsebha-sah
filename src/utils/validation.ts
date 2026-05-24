import type { BackupData } from '../types';

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'الاسم مطلوب';
  if (trimmed.length < 2) return 'الاسم قصير جدًا';
  if (trimmed.length > 50) return 'الاسم طويل جدًا';
  return null;
}

export function validateBudget(value: number): string | null {
  if (isNaN(value) || value < 0) return 'يرجى إدخال مبلغ صحيح';
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
  const s = d.settings as Record<string, unknown>;
  if (s.id !== 'settings') return false;
  if (typeof s.name !== 'string') return false;
  if (typeof s.budget !== 'number') return false;
  return true;
}

export function validateWeddingDate(dateStr: string): string | null {
  if (!dateStr) return 'تاريخ الزواج مطلوب';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'التاريخ غير صحيح';
  return null;
}

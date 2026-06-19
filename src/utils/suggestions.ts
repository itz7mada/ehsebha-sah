// Quick-start item suggestions per main category (قسم) name.
// Shared single source consumed by SectionDetail, Quick Add, and empty states.
// Pure data — no logic that touches storage, network, or privacy.

export const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  'المهر': ['الذهب', 'الشبكة', 'دفعة المهر', 'الهدايا'],
  'الزهبة': ['ذهب العروس', 'السوار', 'الخاتم', 'المصوغات'],
  'الملجة': ['لبس العريس', 'لبس العروس', 'عباءة العروس', 'الحذاء'],
  'العرس': ['القاعة', 'الضيافة', 'التصوير', 'الكوشة', 'الذبايح'],
  'التجهيزات': ['الأثاث', 'الأجهزة', 'المطبخ', 'مستلزمات البيت'],
  'السكن': ['الإيجار', 'الأثاث', 'الأجهزة', 'المطبخ'],
  'شهر العسل': ['التذاكر', 'الفندق', 'المواصلات', 'المصروف اليومي'],
  'أخرى': ['مصاريف متنوعة'],
};

/** Suggested item names for a category, or [] if none. */
export function getSuggestionsForCategory(name: string): string[] {
  return CATEGORY_SUGGESTIONS[name] ?? [];
}

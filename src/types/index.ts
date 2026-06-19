export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type Priority = 'essential' | 'important' | 'luxury';
export type Responsibility = 'groom' | 'bride' | 'grooms_family' | 'brides_family' | 'shared' | 'untracked';
export type SupportStatus = 'expected' | 'received';
export type ThemeMode = 'light' | 'dark' | 'system';
export type HousingSituation = 'family' | 'rent' | 'villa' | 'undecided';
export type UserRole = 'groom' | 'bride' | 'couple' | 'general';
export type TransactionType = 'paid' | 'partial' | 'scheduled';
export type JourneyEventType =
  | 'setup_complete'
  | 'expense_added'
  | 'payment_made'
  | 'category_added'
  | 'support_added'
  | 'budget_updated'
  | 'milestone';

export interface NotificationPrefs {
  enabled: boolean;
  weekly: boolean;
  monthly: boolean;
  midpoint: boolean;
  nearWedding: boolean;
  budgetOverrun: boolean;
  paymentDue?: boolean;
  lastChecked?: string;
  paymentDueLastChecked?: string;
}

export interface Settings {
  id: 'settings';
  name: string;
  weddingDate: string;
  budget: number;
  emergencyReserve?: number;
  emergencyReserveMode?: 'from_budget' | 'extra';
  theme: ThemeMode;
  setupComplete: boolean;
  housingSituation?: HousingSituation;
  notificationPrefs?: NotificationPrefs;
  userRole?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  imageData?: string;
  notes?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  isActive: boolean;
  order: number;
  isSystem: boolean;
  color?: string;
  budget?: number;
}

export interface ExpenseItem {
  id: string;
  categoryId: string;
  name: string;
  expectedAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate?: string;
  notes?: string;
  imageData?: string;
  images?: string[];
  priority: Priority;
  responsibility: Responsibility;
  createdAt: string;
  updatedAt: string;
}

export interface SupportItem {
  id: string;
  name: string;
  relation: string;
  amount: number;
  status: SupportStatus;
  date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  title: string;
  description?: string;
  amount?: number;
  categoryId?: string;
  expenseId?: string;
  date: string;
}

export interface BudgetStats {
  totalBudget: number;
  emergencyReserve: number;
  availableBudget: number;
  totalSpent: number;
  remaining: number;
  spentPercentage: number;
  comfortLevel: 'comfortable' | 'balanced' | 'attention' | 'exceeded';
  daysRemaining: number | null;
  totalExpected: number;
  totalSupportReceived: number;
}

export interface SuggestionItem {
  id: string;
  text: string;
  createdAt: string;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  settings: Settings;
  categories: Category[];
  expenses: ExpenseItem[];
  support: SupportItem[];
  journey: JourneyEvent[];
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'المهر', emoji: '💍', isActive: false, order: 1, isSystem: true, color: '#C99368' },
  { name: 'الملجة', emoji: '👗', isActive: false, order: 2, isSystem: true, color: '#ED6A5A' },
  { name: 'العرس', emoji: '🎊', isActive: false, order: 3, isSystem: true, color: '#9B5DE5' },
  { name: 'السكن', emoji: '🏠', isActive: false, order: 4, isSystem: true, color: '#00BBF9' },
  { name: 'شهر العسل', emoji: '🌙', isActive: false, order: 5, isSystem: true, color: '#2FAE72' },
  { name: 'أخرى', emoji: '📋', isActive: false, order: 6, isSystem: true, color: '#8A8F98' },
];

// ─── User role personalization ──────────────────────────────────────────────
// Light personalization only — never deletes or alters existing user data.

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  groom: 'المعرس',
  bride: 'العروس',
  couple: 'نخطط مع بعض',
  general: 'عام',
};

// Short tagline used in dashboard / onboarding greetings.
const ROLE_TAGLINE: Record<UserRole, string> = {
  groom: 'خلنا نرتب حسبة الزواج خطوة بخطوة',
  bride: 'خلنا نرتب تجهيزات الزواج بوضوح',
  couple: 'خلونا نرتب خطتكم خطوة بخطوة',
  general: 'خلنا نرتب الخطة خطوة بخطوة',
};

export function roleTagline(role?: UserRole): string {
  return ROLE_TAGLINE[role ?? 'general'] ?? ROLE_TAGLINE.general;
}

export interface NameStepCopy {
  title: string;
  subtitle: string;
  fieldLabel: string;
  placeholder: string;
}

export function getNameStepCopy(role?: UserRole): NameStepCopy {
  switch (role) {
    case 'groom':
      return { title: 'شو اسمك؟', subtitle: 'خلنا نرتب لك حسبة الزواج باسمك.', fieldLabel: 'اسمك', placeholder: 'مثلاً: عبدالله' };
    case 'bride':
      return { title: 'شو اسمج؟', subtitle: 'خلنا نرتب لج تجهيزات الزواج بوضوح.', fieldLabel: 'اسمج', placeholder: 'مثلاً: مريم' };
    case 'couple':
      return { title: 'شو نكتب اسم الخطة؟', subtitle: 'مثلاً: عبدالله ومريم', fieldLabel: 'اسم الخطة', placeholder: 'مثلاً: عبدالله ومريم' };
    default:
      return { title: 'شو اسمك؟', subtitle: 'خلنا نرتب لك التجربة.', fieldLabel: 'الاسم', placeholder: 'مثلاً: عبدالله' };
  }
}

/**
 * Welcome-step greeting LEAD (the text before the highlighted name).
 * Couple mode is structurally different — the name is a plan name, so we say
 * "تمام، خلونا نبدأ خطة {name}" instead of greeting a single person.
 */
export function getRoleGreeting(role?: UserRole): string {
  switch (role) {
    case 'bride':  return 'الله حيّاج يا';
    case 'couple': return 'تمام، خلونا نبدأ خطة';
    default:       return 'الله حيّه يا';
  }
}

/** Welcome-step subtitle (distinct from the shorter dashboard tagline). */
export function getRoleWelcomeSubtitle(role?: UserRole): string {
  switch (role) {
    case 'groom':  return 'خلنا نرتب حسبة الزواج خطوة بخطوة، بدون تعقيد.';
    case 'bride':  return 'خلنا نرتب تجهيزات الزواج خطوة بخطوة، بدون تعقيد.';
    case 'couple': return 'بنرتب الخطة مع بعض خطوة بخطوة، بدون تعقيد.';
    default:       return 'بنرتب رحلة الزواج خطوة بخطوة، بدون تعقيد.';
  }
}

/** Plan title with the user's name — for share image / preview. */
export function getRolePlanTitle(role: UserRole | undefined, name: string): string {
  switch (role) {
    case 'bride':  return `خطة تجهيزات ${name}`;
    case 'couple': return `خطة ${name}`;
    default:       return `خطة زواج ${name}`;
  }
}

/** Plan label without a name — for report section headings. */
export function getRolePlanLabel(role?: UserRole): string {
  switch (role) {
    case 'bride':  return 'خطة التجهيزات';
    case 'couple': return 'الخطة';
    default:       return 'خطة الزواج';
  }
}

/** Empty-state copy for "no items yet" surfaces (plan-level). */
export function getRoleEmptyState(role?: UserRole): string {
  switch (role) {
    case 'groom':  return 'ما أضفت بنود بعد. ابدأ بأول بند في حسبة الزواج.';
    case 'bride':  return 'ما أضفتي تجهيزات بعد. ابدئي بأول بند.';
    case 'couple': return 'ما أضفتوا بنود بعد. ابدؤوا بأول بند في الخطة.';
    default:       return 'ما أضفت شيء بعد. ابدأ بأول بند في الخطة.';
  }
}

// Visual metadata for every category name we may suggest, keyed by name so
// role variants stay consistent with the base DEFAULT_CATEGORIES styling.
const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  'المهر': { emoji: '💍', color: '#C99368' },
  'الزهبة': { emoji: '✨', color: '#C9A227' },
  'الملجة': { emoji: '👗', color: '#ED6A5A' },
  'العرس': { emoji: '🎊', color: '#9B5DE5' },
  'التجهيزات': { emoji: '🎁', color: '#E08A5B' },
  'السكن': { emoji: '🏠', color: '#00BBF9' },
  'شهر العسل': { emoji: '🌙', color: '#2FAE72' },
  'أخرى': { emoji: '📋', color: '#8A8F98' },
};

// Suggested (default) categories per role for NEW users during onboarding.
// 'general' mirrors the base DEFAULT_CATEGORIES list.
const ROLE_CATEGORY_NAMES: Record<UserRole, string[]> = {
  groom: ['المهر', 'الملجة', 'العرس', 'السكن', 'شهر العسل'],
  bride: ['الزهبة', 'الملجة', 'العرس', 'التجهيزات', 'السكن', 'شهر العسل'],
  couple: ['المهر', 'الملجة', 'العرس', 'السكن', 'شهر العسل', 'التجهيزات'],
  general: DEFAULT_CATEGORIES.map((c) => c.name),
};

export function getDefaultCategoriesByRole(role?: UserRole): Omit<Category, 'id'>[] {
  const names = ROLE_CATEGORY_NAMES[role ?? 'general'] ?? ROLE_CATEGORY_NAMES.general;
  return names.map((name, i) => {
    const meta = CATEGORY_META[name] ?? { emoji: '📋', color: '#8A8F98' };
    return { name, emoji: meta.emoji, isActive: false, order: i + 1, isSystem: true, color: meta.color };
  });
}

export const RELATION_OPTIONS = [
  'الأب', 'الأم', 'الأخ', 'الأخت', 'الجد', 'الجدة',
  'العم', 'العمة', 'الخال', 'الخالة', 'صديق', 'قريب', 'أخرى'
];

export const RESPONSIBILITY_LABELS: Record<Responsibility, string> = {
  groom: 'الزوج',
  bride: 'الزوجة',
  grooms_family: 'أهل الزوج',
  brides_family: 'أهل الزوجة',
  shared: 'مشترك',
  untracked: 'غير محسوب',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  essential: 'ضروري',
  important: 'مهم',
  luxury: 'كمالي',
};

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'غير مدفوع',
  partial: 'جزئي',
  paid: 'مدفوع',
};

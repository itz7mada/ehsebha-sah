export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type Priority = 'essential' | 'important' | 'luxury';
export type Responsibility = 'groom' | 'bride' | 'grooms_family' | 'brides_family' | 'shared' | 'untracked';
export type SupportStatus = 'expected' | 'received';
export type ThemeMode = 'light' | 'dark' | 'system';
export type HousingSituation = 'family' | 'rent' | 'villa' | 'undecided';
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
  lastChecked?: string;
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

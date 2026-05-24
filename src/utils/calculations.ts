import type { ExpenseItem, SupportItem, Settings, BudgetStats } from '../types';
import { getDaysRemaining } from './formatting';

export function calculateBudgetStats(
  settings: Settings,
  expenses: ExpenseItem[],
  support: SupportItem[]
): BudgetStats {
  const totalSupportReceived = support
    .filter(s => s.status === 'received')
    .reduce((sum, s) => sum + s.amount, 0);

  const emergencyReserveAmount = settings.emergencyReserve ?? 0;
  const emergencyDeduction = settings.emergencyReserveMode === 'extra' ? 0 : emergencyReserveAmount;
  const availableBudget = settings.budget + totalSupportReceived - emergencyDeduction;

  const totalSpent = expenses.reduce((sum, e) => sum + e.paidAmount, 0);

  const totalExpected = expenses.reduce((sum, e) => sum + e.expectedAmount, 0);

  const remaining = availableBudget - totalSpent;

  const spentPercentage = availableBudget > 0
    ? (totalSpent / availableBudget) * 100
    : 0;

  let comfortLevel: BudgetStats['comfortLevel'];
  if (totalSpent > availableBudget) {
    comfortLevel = 'exceeded';
  } else if (spentPercentage < 70) {
    comfortLevel = 'comfortable';
  } else if (spentPercentage < 85) {
    comfortLevel = 'balanced';
  } else {
    comfortLevel = 'attention';
  }

  const daysRemaining = settings.weddingDate
    ? getDaysRemaining(settings.weddingDate)
    : null;

  return {
    totalBudget: settings.budget,
    emergencyReserve: settings.emergencyReserve ?? 0,
    availableBudget,
    totalSpent,
    remaining,
    spentPercentage,
    comfortLevel,
    daysRemaining,
    totalExpected,
    totalSupportReceived,
  };
}

export function getUpcomingPayments(
  expenses: ExpenseItem[]
): ExpenseItem[] {
  const now = new Date();
  return expenses
    .filter(e => e.dueDate && e.status !== 'paid')
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    })
    .filter(e => {
      if (!e.dueDate) return false;
      const dueDate = new Date(e.dueDate);
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= -7 && daysUntil <= 60;
    })
    .slice(0, 5);
}

export function getCategoryTotal(expenses: ExpenseItem[], categoryId: string) {
  const catExpenses = expenses.filter(e => e.categoryId === categoryId);
  return {
    expected: catExpenses.reduce((s, e) => s + e.expectedAmount, 0),
    paid: catExpenses.reduce((s, e) => s + e.paidAmount, 0),
    count: catExpenses.length,
    paidCount: catExpenses.filter(e => e.status === 'paid').length,
  };
}

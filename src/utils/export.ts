import type { BackupData, ExpenseItem, SupportItem } from '../types';
import { formatCurrency, formatDate } from './formatting';
import { RESPONSIBILITY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '../types';

export function downloadJSON(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ehsebha-sah-backup-${formatDate(new Date().toISOString())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExpensesCSV(
  expenses: ExpenseItem[],
  categoryName: (id: string) => string
): void {
  const headers = ['الاسم', 'القسم', 'المتوقع', 'المدفوع', 'المتبقي', 'الحالة', 'الأولوية', 'على من', 'تاريخ الاستحقاق', 'ملاحظات'];
  const rows = expenses.map(e => [
    e.name,
    categoryName(e.categoryId),
    e.expectedAmount,
    e.paidAmount,
    e.expectedAmount - e.paidAmount,
    STATUS_LABELS[e.status],
    PRIORITY_LABELS[e.priority],
    RESPONSIBILITY_LABELS[e.responsibility],
    e.dueDate ? formatDate(e.dueDate) : '',
    e.notes || '',
  ]);
  downloadCSV([headers, ...rows], 'ehsebha-sah-expenses');
}

export function exportSupportCSV(support: SupportItem[]): void {
  const headers = ['الاسم', 'صلة القرابة', 'المبلغ', 'الحالة', 'التاريخ', 'ملاحظات'];
  const rows = support.map(s => [
    s.name,
    s.relation,
    s.amount,
    s.status === 'received' ? 'مستلم' : 'متوقع',
    s.date ? formatDate(s.date) : '',
    s.notes || '',
  ]);
  downloadCSV([headers, ...rows], 'ehsebha-sah-support');
}

function downloadCSV(rows: (string | number)[][], filename: string): void {
  const BOM = '﻿';
  const content = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateBudgetReportText(
  name: string,
  budget: number,
  spent: number,
  remaining: number,
  support: number
): string {
  return `تقرير ميزانية احسبها صح - ${name}
============================
الميزانية الشخصية: ${formatCurrency(budget)}
المعونات المستلمة: ${formatCurrency(support)}
الميزانية المتاحة: ${formatCurrency(budget + support)}
المصروف الفعلي: ${formatCurrency(spent)}
المتبقي: ${formatCurrency(remaining)}

تاريخ التصدير: ${new Date().toLocaleDateString('ar-AE')}
`;
}

import type { Settings, Category, ExpenseItem, SupportItem, BudgetStats } from '../types';

interface ReportData {
  settings: Settings;
  categories: Category[];
  expenses: ExpenseItem[];
  support: SupportItem[];
  stats: BudgetStats;
}

export function printWeddingReport(data: ReportData): void {
  const { settings, categories, expenses, support, stats } = data;

  const isoDate = new Date().toISOString().split('T')[0];
  const today = new Date().toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
  const weddingDate = settings.weddingDate
    ? new Date(settings.weddingDate).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'غير محدد';

  function fmt(n: number): string {
    return n.toLocaleString('en-US') + ' د.إ';
  }

  const activeCategories = categories
    .filter(c => c.isActive && c.name !== 'الطوارئ')
    .sort((a, b) => a.order - b.order);

  const catRows = activeCategories.map(cat => {
    const catExpenses = expenses.filter(e => e.categoryId === cat.id);
    const expected = catExpenses.reduce((s, e) => s + e.expectedAmount, 0);
    const paid = catExpenses.reduce((s, e) => s + e.paidAmount, 0);
    const remaining = expected - paid;
    const paidCount = catExpenses.filter(e => e.status === 'paid').length;
    const total = catExpenses.length;
    const pct = total > 0 ? Math.round((paidCount / total) * 100) : 0;
    return `<tr>
      <td>${cat.emoji} ${cat.name}</td>
      <td class="num">${fmt(expected)}</td>
      <td class="num green">${fmt(paid)}</td>
      <td class="num orange">${remaining > 0 ? fmt(remaining) : '—'}</td>
      <td class="num">${total > 0 ? pct + '%' : '—'}</td>
    </tr>`;
  }).join('');

  const paidExpenses = expenses
    .filter(e => e.paidAmount > 0)
    .sort((a, b) => (b.dueDate ?? b.updatedAt).localeCompare(a.dueDate ?? a.updatedAt));

  const paymentRows = paidExpenses.map(exp => {
    const cat = categories.find(c => c.id === exp.categoryId);
    const dateStr = exp.dueDate
      ? new Date(exp.dueDate).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';
    return `<tr>
      <td>${cat?.name ?? '—'}</td>
      <td>${exp.name}</td>
      <td>${dateStr}</td>
      <td class="num green">${fmt(exp.paidAmount)}</td>
    </tr>`;
  }).join('');

  const supportRows = support.map(s => {
    const dateStr = s.date
      ? new Date(s.date).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';
    return `<tr>
      <td>${s.name}</td>
      <td>${s.relation}</td>
      <td class="num green">${fmt(s.amount)}</td>
      <td>${s.status === 'received' ? 'مستلم' : 'متوقع'}</td>
      <td>${dateStr}</td>
    </tr>`;
  }).join('');

  const comfortLabels: Record<string, string> = {
    comfortable: 'مريح',
    balanced: 'متوازن',
    attention: 'يحتاج انتباه',
    exceeded: 'تجاوز الميزانية',
  };

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>احسبها-صح-${isoDate}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', sans-serif; direction: rtl; color: #1a1a2e; background: #fff; padding: 32px; font-size: 14px; }
    h1 { font-size: 28px; font-weight: 800; color: #6c5ce7; }
    .subtitle { font-size: 12px; color: #888; margin-top: 6px; }
    h2 { font-size: 15px; font-weight: 700; color: #6c5ce7; margin: 28px 0 12px; border-bottom: 2px solid #e8e4ff; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f0edff; color: #6c5ce7; font-weight: 700; padding: 8px 12px; text-align: right; }
    td { padding: 8px 12px; border-bottom: 1px solid #f5f5f5; }
    tr:last-child td { border-bottom: none; }
    .num { direction: ltr; text-align: right; font-weight: 700; }
    .green { color: #27ae60; }
    .orange { color: #e67e22; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    .stat-box { background: #f8f7ff; border-radius: 10px; padding: 14px; text-align: center; }
    .stat-label { font-size: 11px; color: #888; margin-bottom: 4px; }
    .stat-val { font-size: 16px; font-weight: 800; color: #6c5ce7; }
    .empty { color: #aaa; font-size: 13px; padding: 12px 0; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>احسبها صح</h1>
  <p class="subtitle">تقرير الميزانية · تاريخ التصدير: ${today} · يوم الزواج: ${weddingDate}</p>

  <h2>نظرة الميزانية</h2>
  <div class="stat-grid">
    <div class="stat-box">
      <div class="stat-label">الميزانية الإجمالية</div>
      <div class="stat-val">${fmt(stats.totalBudget)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">المصروف</div>
      <div class="stat-val green">${fmt(stats.totalSpent)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">المتبقي</div>
      <div class="stat-val orange">${fmt(stats.remaining)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">المخطط الإجمالي</div>
      <div class="stat-val">${fmt(stats.totalExpected)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">المساهمات المستلمة</div>
      <div class="stat-val green">${fmt(stats.totalSupportReceived)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">الوضع المالي</div>
      <div class="stat-val">${comfortLabels[stats.comfortLevel] ?? stats.comfortLevel}</div>
    </div>
  </div>

  <h2>خطة الزواج</h2>
  ${activeCategories.length > 0 ? `<table>
    <thead><tr><th>البند الرئيسي</th><th>المخطط</th><th>المصروف</th><th>المتبقي</th><th>الإنجاز</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>` : '<p class="empty">لا توجد بنود رئيسية.</p>'}

  <h2>الدفعات</h2>
  ${paidExpenses.length > 0 ? `<table>
    <thead><tr><th>البند الرئيسي</th><th>العنصر</th><th>التاريخ</th><th>المبلغ</th></tr></thead>
    <tbody>${paymentRows}</tbody>
  </table>` : '<p class="empty">لا توجد دفعات مسجلة.</p>'}

  <h2>المساهمات</h2>
  ${support.length > 0 ? `<table>
    <thead><tr><th>الاسم</th><th>الصلة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead>
    <tbody>${supportRows}</tbody>
  </table>` : '<p class="empty">لا توجد مساهمات مسجلة.</p>'}

  <div class="footer">احسبها صح · صُنع بمحبة لخدمة المقبلين على الزواج</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 800);
}

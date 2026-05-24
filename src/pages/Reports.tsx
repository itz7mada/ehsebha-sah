import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import * as db from '../db/database';
import { formatCurrency } from '../utils/formatting';
import { exportExpensesCSV, downloadJSON } from '../utils/export';
import type { PaymentStatus } from '../types';
import { STATUS_LABELS } from '../types';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { DownloadIcon, FilterIcon } from '../components/common/Icons';

const ALL = '__all__';

export default function Reports() {
  const { state } = useApp();
  const { expenses, categories, support, stats, settings } = state;

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | typeof ALL>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);

  const activeCategories = categories.filter(c => c.isActive);

  const catName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? `${cat.emoji} ${cat.name}` : id;
  };

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (statusFilter !== ALL && e.status !== statusFilter) return false;
      if (categoryFilter !== ALL && e.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [expenses, statusFilter, categoryFilter]);

  const filteredExpected = filtered.reduce((s, e) => s + e.expectedAmount, 0);
  const filteredPaid = filtered.reduce((s, e) => s + e.paidAmount, 0);

  const catTotals = useMemo(() => {
    return activeCategories.map(cat => {
      const catExpenses = expenses.filter(e => e.categoryId === cat.id);
      const expected = catExpenses.reduce((s, e) => s + e.expectedAmount, 0);
      const paid = catExpenses.reduce((s, e) => s + e.paidAmount, 0);
      return { cat, expected, paid, count: catExpenses.length };
    }).filter(x => x.expected > 0 || x.count > 0);
  }, [expenses, activeCategories]);

  const maxCatExpected = Math.max(...catTotals.map(c => c.expected), 1);

  const totalSupportExpected = support.reduce((s, i) => s + i.amount, 0);
  const totalSupportReceived = support.filter(i => i.status === 'received').reduce((s, i) => s + i.amount, 0);

  const paidCount = expenses.filter(e => e.status === 'paid').length;
  const partialCount = expenses.filter(e => e.status === 'partial').length;
  const unpaidCount = expenses.filter(e => e.status === 'unpaid').length;

  async function handleExportJSON() {
    try {
      const backup = await db.exportBackup();
      downloadJSON(backup);
    } catch {
      // silently fail
    }
  }

  function handleExportCSV() {
    exportExpensesCSV(expenses, id => {
      const cat = categories.find(c => c.id === id);
      return cat ? cat.name : id;
    });
  }

  const pageStyle: React.CSSProperties = {
    flex: 1,
    background: 'var(--bg-primary)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-5)',
    paddingTop: 'var(--page-top)',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-light)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const contentStyle: React.CSSProperties = {
    padding: 'var(--space-4)',
    maxWidth: '480px',
    margin: '0 auto',
    paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + var(--space-6))',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
    padding: 'var(--space-4)',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-3)',
  };

  const selectStyle: React.CSSProperties = {
    flex: 1,
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--border)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'var(--font-family)',
    direction: 'rtl',
    outline: 'none',
  };

  const comfortColor = stats?.comfortLevel === 'comfortable'
    ? 'var(--success)' : stats?.comfortLevel === 'balanced' ? 'var(--warning)' : 'var(--danger)';

  const comfortLabel = stats?.comfortLevel === 'comfortable'
    ? 'مريح' : stats?.comfortLevel === 'balanced' ? 'متوازن' : 'تنبيه';

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={headerStyle}>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
          التقارير
        </h1>
      </div>

      <div style={contentStyle}>
        {/* Budget summary */}
        {stats && (
          <div style={cardStyle}>
            <p style={sectionTitle}>ملخص الميزانية</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>مستوى الراحة</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: comfortColor }}>
                {comfortLabel}
              </span>
            </div>
            <ProgressBar value={stats.spentPercentage} color={comfortColor} height={10} showLabel />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <BudgetRow label="الميزانية الشخصية" value={stats.totalBudget} />
              <BudgetRow label="المتاحة (مع المعونة)" value={stats.availableBudget} color="var(--success)" />
              <BudgetRow label="المصروف الفعلي" value={stats.totalSpent} color="var(--warning)" />
              <BudgetRow label="المتبقي" value={stats.remaining} color={stats.remaining >= 0 ? 'var(--success)' : 'var(--danger)'} />
            </div>
          </div>
        )}

        {/* Categories bar chart */}
        {catTotals.length > 0 && (
          <div style={cardStyle}>
            <p style={sectionTitle}>المصروفات حسب القسم</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {catTotals.map(({ cat, expected, paid }) => (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                      {cat.emoji} {cat.name}
                    </span>
                    <span className="num" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      {formatCurrency(paid)} / {formatCurrency(expected)}
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {/* Expected bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0, bottom: 0, right: 0,
                      width: `${(expected / maxCatExpected) * 100}%`,
                      background: 'var(--accent-light)',
                      borderRadius: 'var(--radius-full)',
                    }} />
                    {/* Paid bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0, bottom: 0, right: 0,
                      width: `${(paid / maxCatExpected) * 100}%`,
                      background: 'var(--accent)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support summary */}
        <div style={cardStyle}>
          <p style={sectionTitle}>ملخص المعونات</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', textAlign: 'center' }}>
            <SmallStat label="إجمالي المتوقع" value={formatCurrency(totalSupportExpected)} />
            <SmallStat label="المستلم" value={formatCurrency(totalSupportReceived)} color="var(--success)" />
            <SmallStat label="عدد الداعمين" value={String(support.length)} />
          </div>
        </div>

        {/* Payment status */}
        <div style={cardStyle}>
          <p style={sectionTitle}>حالة المدفوعات</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', textAlign: 'center' }}>
            <SmallStat label="مدفوع" value={String(paidCount)} color="var(--success)" />
            <SmallStat label="جزئي" value={String(partialCount)} color="var(--warning)" />
            <SmallStat label="غير مدفوع" value={String(unpaidCount)} color="var(--text-tertiary)" />
          </div>
        </div>

        {/* Filters */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <FilterIcon size={16} color="var(--text-secondary)" />
            <p style={{ ...sectionTitle, marginBottom: 0 }}>تصفية المصروفات</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PaymentStatus | typeof ALL)}
              style={selectStyle}
              aria-label="تصفية حسب الحالة"
            >
              <option value={ALL}>الكل</option>
              {(Object.entries(STATUS_LABELS) as [PaymentStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={selectStyle}
              aria-label="تصفية حسب القسم"
            >
              <option value={ALL}>كل الأقسام</option>
              {activeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense table */}
        {settings && (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '340px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {['الاسم', 'القسم', 'المتوقع', 'المدفوع', 'الحالة'].map(h => (
                      <th key={h} style={{
                        padding: 'var(--space-3) var(--space-3)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textAlign: 'start',
                        borderBottom: '1px solid var(--border-light)',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        لا توجد بنود مطابقة
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filtered.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</td>
                          <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{catName(e.categoryId)}</td>
                          <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                            <span className="num" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {formatCurrency(e.expectedAmount)}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                            <span className="num" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                              {formatCurrency(e.paidAmount)}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                            <span className={`status-badge status-${e.status}`} style={{ whiteSpace: 'nowrap' }}>
                              {STATUS_LABELS[e.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                        <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }} colSpan={2}>الإجمالي</td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                          <span className="num" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatCurrency(filteredExpected)}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                          <span className="num" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--accent)' }}>
                            {formatCurrency(filteredPaid)}
                          </span>
                        </td>
                        <td />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Export buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Button
            variant="secondary"
            onClick={handleExportJSON}
            icon={<DownloadIcon size={16} />}
          >
            تصدير JSON
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            icon={<DownloadIcon size={16} />}
          >
            تصدير CSV
          </Button>
        </div>

        {/* Privacy note */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          lineHeight: 1.7,
        }}>
          🔒 كل بياناتك تبقى على جهازك فقط - ما يطلع منها شيء
        </div>
      </div>
    </div>
  );
}

function BudgetRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span
        className="num"
        style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: color ?? 'var(--text-primary)' }}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function SmallStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="num" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: color ?? 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

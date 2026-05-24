import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Loader } from '../components/common/Loader';

function fmt(n: number): string {
  return n.toLocaleString('en-US') + ' د.إ';
}

const COMFORT_LABELS: Record<string, string> = {
  comfortable: 'مريح',
  balanced: 'متوازن',
  attention: 'يحتاج انتباه',
  exceeded: 'تجاوز الميزانية',
};

export default function ReportPreview() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { settings, categories, expenses, support, stats } = state;

  useEffect(() => {
    if (state.initialized && (!settings?.setupComplete || !stats)) {
      navigate('/settings', { replace: true });
    }
  }, [state.initialized, settings, stats, navigate]);

  if (!state.initialized) return <Loader />;
  if (!settings || !stats) return null;

  const today = new Date().toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
  const weddingDate = settings.weddingDate
    ? new Date(settings.weddingDate).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'غير محدد';

  const activeCategories = categories
    .filter(c => c.isActive && c.name !== 'الطوارئ')
    .sort((a, b) => a.order - b.order);

  const paidExpenses = expenses
    .filter(e => e.paidAmount > 0)
    .sort((a, b) => (b.dueDate ?? b.updatedAt).localeCompare(a.dueDate ?? a.updatedAt));

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', direction: 'rtl', fontFamily: 'var(--font-family)' }}>

      {/* Top bar */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <button type="button" onClick={() => navigate('/settings')} style={backBtnStyle}>
          ‹ رجوع
        </button>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)' }}>
          معاينة التقرير
        </span>
        <button type="button" onClick={() => window.print()} style={topPrintBtnStyle}>
          طباعة
        </button>
      </div>

      {/* Report content */}
      <div className="print-report" style={{
        background: '#fff',
        maxWidth: '700px',
        margin: '24px auto',
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#6c5ce7', margin: 0 }}>احسبها صح</h1>
        <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
          تقرير الميزانية · تاريخ التصدير: {today} · يوم الزواج: {weddingDate}
        </p>

        <h2 style={h2Style}>نظرة الميزانية</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
          {[
            { label: 'الميزانية الإجمالية', value: fmt(stats.totalBudget) },
            { label: 'المصروف', value: fmt(stats.totalSpent), color: '#27ae60' },
            { label: 'المتبقي', value: fmt(stats.remaining), color: '#e67e22' },
            { label: 'المخطط الإجمالي', value: fmt(stats.totalExpected) },
            { label: 'المساهمات المستلمة', value: fmt(stats.totalSupportReceived), color: '#27ae60' },
            { label: 'الوضع المالي', value: COMFORT_LABELS[stats.comfortLevel] ?? stats.comfortLevel },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#f8f7ff', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: color ?? '#6c5ce7' }}>{value}</div>
            </div>
          ))}
        </div>

        <h2 style={h2Style}>خطة الزواج</h2>
        {activeCategories.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['البند الرئيسي', 'المخطط', 'المصروف', 'المتبقي', 'الإنجاز'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCategories.map(cat => {
                const catExp = expenses.filter(e => e.categoryId === cat.id);
                const expected = catExp.reduce((s, e) => s + e.expectedAmount, 0);
                const paid = catExp.reduce((s, e) => s + e.paidAmount, 0);
                const remaining = expected - paid;
                const paidCnt = catExp.filter(e => e.status === 'paid').length;
                const total = catExp.length;
                const pct = total > 0 ? Math.round((paidCnt / total) * 100) : 0;
                return (
                  <tr key={cat.id}>
                    <td style={tdStyle}>{cat.emoji} {cat.name}</td>
                    <td style={tdNumStyle}>{fmt(expected)}</td>
                    <td style={{ ...tdNumStyle, color: '#27ae60' }}>{fmt(paid)}</td>
                    <td style={{ ...tdNumStyle, color: '#e67e22' }}>{remaining > 0 ? fmt(remaining) : '—'}</td>
                    <td style={tdNumStyle}>{total > 0 ? pct + '%' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p style={emptyStyle}>لا توجد بنود رئيسية.</p>}

        <h2 style={h2Style}>الدفعات</h2>
        {paidExpenses.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['البند الرئيسي', 'العنصر', 'التاريخ', 'المبلغ'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paidExpenses.map(exp => {
                const cat = categories.find(c => c.id === exp.categoryId);
                const dateStr = exp.dueDate
                  ? new Date(exp.dueDate).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—';
                return (
                  <tr key={exp.id}>
                    <td style={tdStyle}>{cat?.name ?? '—'}</td>
                    <td style={tdStyle}>{exp.name}</td>
                    <td style={tdStyle}>{dateStr}</td>
                    <td style={{ ...tdNumStyle, color: '#27ae60' }}>{fmt(exp.paidAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p style={emptyStyle}>لا توجد دفعات مسجلة.</p>}

        <h2 style={h2Style}>المساهمات</h2>
        {support.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['الاسم', 'الصلة', 'المبلغ', 'الحالة', 'التاريخ'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {support.map(s => {
                const dateStr = s.date
                  ? new Date(s.date).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—';
                return (
                  <tr key={s.id}>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={tdStyle}>{s.relation}</td>
                    <td style={{ ...tdNumStyle, color: '#27ae60' }}>{fmt(s.amount)}</td>
                    <td style={tdStyle}>{s.status === 'received' ? 'مستلم' : 'متوقع'}</td>
                    <td style={tdStyle}>{dateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p style={emptyStyle}>لا توجد مساهمات مسجلة.</p>}

        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '11px', color: '#aaa', borderTop: '1px solid #eee', paddingTop: '16px' }}>
          احسبها صح · صُنع بمحبة لخدمة المقبلين على الزواج
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="no-print" style={{
        position: 'fixed',
        bottom: 0,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-light)',
        padding: '14px 20px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
        display: 'flex',
        gap: '12px',
        zIndex: 20,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
      }}>
        <button type="button" onClick={() => window.print()} style={printBtnStyle}>
          طباعة / حفظ PDF
        </button>
        <button type="button" onClick={() => navigate('/settings')} style={backActionBtnStyle}>
          رجوع للتطبيق
        </button>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="no-print" style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-secondary)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const topPrintBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--accent)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 700,
  color: '#fff',
};

const printBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: '14px',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--accent)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 700,
  color: '#fff',
};

const backActionBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--bg-secondary)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const h2Style: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#6c5ce7',
  margin: '28px 0 12px',
  borderBottom: '2px solid #e8e4ff',
  paddingBottom: '6px',
};

const thStyle: React.CSSProperties = {
  background: '#f0edff',
  color: '#6c5ce7',
  fontWeight: 700,
  padding: '8px 12px',
  textAlign: 'right',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #f5f5f5',
  color: '#1a1a2e',
};

const tdNumStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #f5f5f5',
  direction: 'ltr',
  textAlign: 'right',
  fontWeight: 700,
  color: '#1a1a2e',
};

const emptyStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: '13px',
  padding: '12px 0',
};

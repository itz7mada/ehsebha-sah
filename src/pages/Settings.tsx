import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as db from '../db/database';
import { downloadJSON } from '../utils/export';
import { validateBackupFile, validateBudget, validateWeddingDate, getTodayDateInputValue, isPastDate } from '../utils/validation';
import { parseCurrencyInput, generateId, now } from '../utils/formatting';
import {
  requestNotificationPermission,
  getNotificationPermission,
  defaultNotificationPrefs,
} from '../utils/notifications';
import type { NotificationPrefs, HousingSituation, ThemeMode } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { BottomSheet } from '../components/common/BottomSheet';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  DownloadIcon, UploadIcon, TrashIcon,
  CalendarIcon, WalletIcon, AlertIcon, HomeIcon, SunIcon, MoonIcon,
  ChevronRightIcon, CheckIcon,
} from '../components/common/Icons';

type ModalType = 'date' | 'budget' | 'housing' | null;

const HOUSING_LABELS: Record<HousingSituation, string> = {
  family: 'بيت الأهل',
  rent: 'إيجار',
  villa: 'فيلا / بيت مستقل',
  undecided: 'بعدني ما قررت',
};
const HOUSING_OPTIONS: HousingSituation[] = ['family', 'rent', 'villa', 'undecided'];


export default function Settings() {
  const navigate = useNavigate();
  const { state, dispatch, refreshData } = useApp();
  const { settings } = state;

  const [modal, setModal] = useState<ModalType>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [pendingHousing, setPendingHousing] = useState<HousingSituation | undefined>();
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importMsg, setImportMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showSuggestionSheet, setShowSuggestionSheet] = useState(false);
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!settings) return null;

  const notifPrefs: NotificationPrefs = settings.notificationPrefs ?? defaultNotificationPrefs();
  const notifPermission = getNotificationPermission();

  function openModal(type: ModalType) {
    if (!settings) return;
    setFieldError('');
    if (type === 'date') setFieldValue(settings.weddingDate || '');
    else if (type === 'budget') setFieldValue(String(settings.budget));
    else if (type === 'housing') setPendingHousing(settings.housingSituation ?? 'family');
    setModal(type);
  }

  async function saveHousing() {
    if (!settings || pendingHousing === undefined) return;
    setSaving(true);
    try {
      const updated = { ...settings, housingSituation: pendingHousing, updatedAt: now() };
      await db.saveSettings(updated);
      dispatch({ type: 'UPDATE_SETTINGS', payload: updated });
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function saveField() {
    if (!settings) return;
    if (modal === 'housing') { await saveHousing(); return; }
    setSaving(true);
    setFieldError('');
    try {
      let error: string | null = null;
      let updated = { ...settings, updatedAt: now() };

      if (modal === 'date') {
        error = validateWeddingDate(fieldValue);
        if (!error) updated = { ...updated, weddingDate: fieldValue };
      } else if (modal === 'budget') {
        const amt = parseCurrencyInput(fieldValue);
        error = validateBudget(amt);
        if (!error) {
          const journeyEvent = {
            id: generateId(),
            type: 'budget_updated' as const,
            title: 'تم تحديث الميزانية الإجمالية',
            amount: amt,
            date: now(),
          };
          await db.addJourneyEvent(journeyEvent);
          dispatch({ type: 'ADD_JOURNEY', payload: journeyEvent });
          updated = { ...updated, budget: amt };
        }
      }

      if (error) {
        setFieldError(error);
        return;
      }

      await db.saveSettings(updated);
      dispatch({ type: 'UPDATE_SETTINGS', payload: updated });
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function updateNotifPrefs(patch: Partial<NotificationPrefs>) {
    if (!settings) return;
    const updated = {
      ...settings,
      updatedAt: now(),
      notificationPrefs: { ...notifPrefs, ...patch },
    };
    await db.saveSettings(updated);
    dispatch({ type: 'UPDATE_SETTINGS', payload: updated });
  }

  async function handleNotifMainToggle() {
    if (notifPrefs.enabled) {
      await updateNotifPrefs({ enabled: false });
      return;
    }
    if (notifPermission === 'unsupported') return;
    if (notifPermission === 'denied') return;
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      await updateNotifPrefs({ enabled: true });
    }
  }

  async function handleThemeChange(mode: ThemeMode) {
    if (!settings) return;
    const updated = { ...settings, theme: mode, updatedAt: now() };
    await db.saveSettings(updated);
    dispatch({ type: 'UPDATE_SETTINGS', payload: updated });
  }

  async function handleExportJSON() {
    try {
      const backup = await db.exportBackup();
      downloadJSON(backup);
    } catch {
      // fail silently
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      setImportMsg({ text: 'حجم الملف كبير جداً. الحد الأقصى 5 ميغابايت.', ok: false });
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!validateBackupFile(data)) {
        setImportMsg({ text: 'الملف غير صالح أو تالف. تأكد من اختيار ملف نسخة احتياطية صحيح.', ok: false });
        return;
      }
      await db.importBackup(data);
      await refreshData();
      setImportMsg({ text: 'تم استيراد البيانات بنجاح.', ok: true });
    } catch {
      setImportMsg({ text: 'حدث خطأ أثناء الاستيراد. تأكد من أن الملف بصيغة JSON صحيحة.', ok: false });
    }
    setTimeout(() => setImportMsg(null), 4000);
  }

  function handleSendFeedback() {
    if (!suggestionName.trim() || !suggestionTitle.trim() || !suggestionText.trim()) return;
    // obfuscated to avoid plain-text scraping
    const feedbackEmail = ['itz7mada', 'gmail.com'].join('@');
    const subject = encodeURIComponent(`اقتراح: ${suggestionTitle.trim()}`);
    const body = encodeURIComponent(`الاسم: ${suggestionName.trim()}\n\n${suggestionText.trim()}`);
    const mailtoUrl = `mailto:${feedbackEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    setSuggestionName('');
    setSuggestionTitle('');
    setSuggestionText('');
    setShowSuggestionSheet(false);
  }

  function handleCopyEmail() {
    const feedbackEmail = ['itz7mada', 'gmail.com'].join('@');
    navigator.clipboard.writeText(feedbackEmail).then(() => {
      setFeedbackCopied(true);
      setTimeout(() => setFeedbackCopied(false), 2500);
    }).catch(() => {});
  }

  async function handleDeleteAll() {
    await db.clearAllData();
    dispatch({ type: 'RESET' });
    window.location.href = '/';
  }

  function handlePrintReport() {
    navigate('/report');
  }

  const pageStyle: React.CSSProperties = {
    flex: 1,
    background: 'var(--bg-primary)',
  };

  const headerStyle: React.CSSProperties = {
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
    gap: 'var(--space-5)',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 'var(--space-2)',
    paddingRight: 'var(--space-1)',
  };

  const cardGroupStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
    overflow: 'hidden',
  };

  const toggleSwitchStyle = (on: boolean): React.CSSProperties => ({
    width: '44px',
    height: '26px',
    borderRadius: '13px',
    background: on ? 'var(--accent)' : 'var(--border)',
    position: 'relative',
    transition: 'background var(--transition-fast)',
    flexShrink: 0,
    cursor: 'pointer',
    border: 'none',
    padding: 0,
  });

  const toggleKnobStyle = (on: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '3px',
    insetInlineStart: on ? 'calc(100% - 23px)' : '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'white',
    transition: 'inset-inline-start var(--transition-fast)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  });

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={headerStyle}>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
          الإعدادات
        </h1>
      </div>

      <div style={contentStyle}>
        {importMsg && (
          <div style={{
            background: importMsg.ok ? 'var(--success-light)' : 'var(--danger-light)',
            color: importMsg.ok ? 'var(--success)' : 'var(--danger)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            animation: 'fadeIn 200ms both',
          }}>
            {importMsg.text}
          </div>
        )}

        {/* 0. المظهر */}
        <div>
          <p style={sectionLabel}>المظهر</p>
          <div style={{ ...cardGroupStyle, padding: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
              {([
                { mode: 'light' as ThemeMode, label: 'فاتح', icon: <SunIcon size={15} color="currentColor" /> },
                { mode: 'system' as ThemeMode, label: 'تلقائي', icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) },
                { mode: 'dark' as ThemeMode, label: 'غامق', icon: <MoonIcon size={15} color="currentColor" /> },
              ] as const).map(({ mode, label, icon }) => {
                const active = (settings.theme ?? 'system') === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleThemeChange(mode)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-1)',
                      padding: 'var(--space-3) var(--space-2)',
                      borderRadius: 'var(--radius-lg)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: active ? 700 : 500,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1. إعدادات الزواج */}
        <div>
          <p style={sectionLabel}>إعدادات الزواج</p>
          <div style={cardGroupStyle}>
            <SettingsRow
              icon={<CalendarIcon size={18} color="var(--accent)" />}
              label="تاريخ الزواج"
              value={settings.weddingDate || 'غير محدد'}
              onClick={() => openModal('date')}
            />
            <div className="divider" style={{ margin: 0 }} />
            <SettingsRow
              icon={<WalletIcon size={18} color="var(--accent)" />}
              label="الميزانية الإجمالية"
              value={`${settings.budget.toLocaleString('en-US')} د.إ`}
              valueClass="num"
              onClick={() => openModal('budget')}
            />
            <div className="divider" style={{ margin: 0 }} />
            <SettingsRow
              icon={<HomeIcon size={18} color="var(--accent)" />}
              label="السكن بعد الزواج"
              value={settings.housingSituation ? HOUSING_LABELS[settings.housingSituation] : 'غير محدد'}
              onClick={() => openModal('housing')}
            />
          </div>
        </div>

        {/* 2. التنبيهات */}
        <div>
          <p style={sectionLabel}>التنبيهات</p>
          <div style={cardGroupStyle}>
            {notifPermission === 'unsupported' ? (
              <div style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={iconWrapStyle}><AlertIcon size={18} color="var(--text-tertiary)" /></span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', flex: 1 }}>
                  التنبيهات غير مدعومة في هذا المتصفح
                </span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                  <span style={iconWrapStyle}><AlertIcon size={18} color="var(--accent)" /></span>
                  <span style={{ flex: 1, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', fontWeight: 600 }}>
                    تفعيل التنبيهات
                  </span>
                  <button
                    type="button"
                    style={toggleSwitchStyle(notifPrefs.enabled && notifPermission === 'granted')}
                    onClick={handleNotifMainToggle}
                    aria-label="تفعيل التنبيهات"
                  >
                    <div style={toggleKnobStyle(notifPrefs.enabled && notifPermission === 'granted')} />
                  </button>
                </div>

                {notifPermission === 'denied' && (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--warning-light)', borderTop: '1px solid var(--border-light)' }}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--warning)', fontWeight: 600 }}>
                      التنبيهات محظورة في إعدادات المتصفح. فعّلها من إعدادات الموقع للمتابعة.
                    </p>
                  </div>
                )}

                {notifPrefs.enabled && notifPermission === 'granted' && (
                  <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-light)' }}>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      ستصلك تذكيرات أسبوعية وتنبيهات عند اقتراب موعد الزواج أو تجاوز الميزانية.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 3. البيانات */}
        <div>
          <p style={sectionLabel}>البيانات</p>
          <div style={cardGroupStyle}>
            <ActionRow
              icon={<DownloadIcon size={18} color="var(--accent)" />}
              label="تصدير نسخة احتياطية"
              onClick={handleExportJSON}
            />
            <div className="divider" style={{ margin: 0 }} />
            <ActionRow
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              }
              label="تصدير تقرير PDF"
              onClick={handlePrintReport}
            />
            <div className="divider" style={{ margin: 0 }} />
            <ActionRow
              icon={<UploadIcon size={18} color="var(--info)" />}
              label="استيراد نسخة احتياطية"
              onClick={handleImportClick}
            />
            <div className="divider" style={{ margin: 0 }} />
            <ActionRow
              icon={<TrashIcon size={18} color="var(--danger)" />}
              label="حذف جميع البيانات"
              labelColor="var(--danger)"
              onClick={() => setShowDeleteConfirm(true)}
            />
          </div>
        </div>

        {/* 4. ملاحظات */}
        <div>
          <p style={sectionLabel}>ملاحظات</p>
          <div style={cardGroupStyle}>
            <ActionRow
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="2,4 12,13 22,4" />
                </svg>
              }
              label="إرسال اقتراح أو ملاحظة"
              onClick={() => { setSuggestionName(''); setSuggestionTitle(''); setSuggestionText(''); setFeedbackCopied(false); setShowSuggestionSheet(true); }}
            />
          </div>
        </div>

        {/* 5. حول التطبيق */}
        <div>
          <p style={sectionLabel}>حول التطبيق</p>
          <div style={{ ...cardGroupStyle, padding: 'var(--space-6) var(--space-5)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                احسبها صح
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', margin: 0, fontWeight: 500 }}>
                الإصدار 1.0.0
              </p>
            </div>

            <div style={{ height: '1px', background: 'var(--border-light)', marginBottom: 'var(--space-4)' }} />

            <p style={aboutBodyStyle}>
              تطبيق مجاني يساعد المقبلين على الزواج على ترتيب الميزانية، فهم الالتزامات، ومتابعة الخطة المالية بطريقة بسيطة وواضحة.
            </p>

            {/* Privacy row */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3) var(--space-4)',
              margin: 'var(--space-4) 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)' }}>خصوصيتك محفوظة</span>
              </div>
              <p style={{ ...aboutBodyStyle, fontSize: 'var(--font-size-xs)' }}>
                لا يجمع التطبيق بياناتك، ولا يرفعها إلى أي خادم. كل معلوماتك محفوظة على جهازك فقط.
              </p>
              <p style={{ ...aboutBodyStyle, fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
                النسخ الاحتياطي والصور تبقى محفوظة على جهازك فقط. احرص على حفظ نسخة احتياطية في مكان آمن إذا احتجتها لاحقاً.
              </p>
            </div>

            <p style={aboutBodyStyle}>
              تم إنشاء هذا التطبيق لخدمة شبابنا وتخفيف عبء التخطيط المالي للزواج، دون أي هدف مادي أو ربحي.
            </p>

            <p style={{ ...aboutBodyStyle, marginTop: 'var(--space-3)' }}>
              نسأل الله أن يبارك لكل من يسعى لبناء بيت مستقر، وأن يجعل بداياتهم مطمئنة وميسّرة.
            </p>

            <div style={{ height: '1px', background: 'var(--border-light)', margin: 'var(--space-4) 0' }} />

            <p style={aboutBodyStyle}>ولا تنسونا من صالح دعائكم.</p>
            <p style={{ ...aboutBodyStyle, marginTop: 'var(--space-2)' }}>
              {'أخوكم، '}
              <a
                href="https://instagram.com/itz7mada"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}
              >
                أحمد بافضل
              </a>
            </p>

          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <BottomSheet
        isOpen={modal === 'date' || modal === 'budget'}
        onClose={() => setModal(null)}
        title={modal === 'date' ? 'تاريخ الزواج' : 'الميزانية الإجمالية'}
        footer={
          <Button fullWidth variant="primary" size="xl" onClick={saveField} loading={saving}>
            حفظ
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {modal === 'date' && (
            <Input
              label="تاريخ الزواج"
              value={fieldValue}
              onChange={setFieldValue}
              type="date"
              min={getTodayDateInputValue()}
              error={fieldError}
              hint={isPastDate(settings.weddingDate) ? 'تاريخك الحالي قديم — حدّثه ليكون اليوم أو بعده.' : undefined}
              autoFocus
            />
          )}
          {modal === 'budget' && (
            <Input
              label="الميزانية الإجمالية"
              value={fieldValue}
              onChange={setFieldValue}
              type="number"
              prefix="د.إ"
              placeholder="0"
              error={fieldError}
              autoFocus
            />
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={modal === 'housing'}
        onClose={() => setModal(null)}
        title="السكن بعد الزواج"
        footer={
          <Button fullWidth variant="primary" size="xl" onClick={saveHousing} loading={saving}>
            حفظ
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {HOUSING_OPTIONS.map(opt => {
            const selected = pendingHousing === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setPendingHousing(opt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent-light)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                  textAlign: 'start',
                  width: '100%',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{ flex: 1, fontSize: 'var(--font-size-base)', fontWeight: selected ? 700 : 500, color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {HOUSING_LABELS[opt]}
                </span>
                {selected && <CheckIcon size={16} color="var(--accent)" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAll}
        title="حذف جميع البيانات؟"
        message="سيتم حذف الميزانية، المساهمات، خطة الزواج، العناصر، والدفعات المحفوظة على هذا الجهاز. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف البيانات"
        cancelText="إلغاء"
        variant="danger"
      />

      <BottomSheet
        isOpen={showSuggestionSheet}
        onClose={() => setShowSuggestionSheet(false)}
        title="إرسال اقتراح"
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Button
              fullWidth
              variant="primary"
              size="xl"
              disabled={!suggestionName.trim() || !suggestionTitle.trim() || !suggestionText.trim()}
              onClick={handleSendFeedback}
            >
              فتح البريد للإرسال
            </Button>
            <button
              type="button"
              onClick={handleCopyEmail}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-xs)',
                color: feedbackCopied ? 'var(--success)' : 'var(--text-tertiary)',
                fontFamily: 'var(--font-family)',
                textAlign: 'center',
                padding: 'var(--space-1)',
                transition: 'color var(--transition-fast)',
              }}
            >
              {feedbackCopied ? '✓ تم نسخ البريد الإلكتروني' : 'أو انسخ البريد الإلكتروني'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="اسمك *"
            value={suggestionName}
            onChange={setSuggestionName}
            placeholder="أدخل اسمك"
            autoFocus
          />
          <Input
            label="عنوان الاقتراح *"
            value={suggestionTitle}
            onChange={setSuggestionTitle}
            placeholder="مثال: إضافة خاصية جديدة"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              تفاصيل الاقتراح *
            </label>
            <textarea
              value={suggestionText}
              onChange={e => setSuggestionText(e.target.value)}
              placeholder="اشرح اقتراحك بالتفصيل..."
              rows={4}
              style={{
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family)',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.7,
                boxSizing: 'border-box',
                direction: 'rtl',
              }}
            />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}


const aboutBodyStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  lineHeight: 1.8,
  margin: 0,
};

const iconWrapStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

function SettingsRow({
  icon,
  label,
  value,
  valueClass,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        padding: 'var(--space-4)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'start',
        fontFamily: 'var(--font-family)',
        transition: 'background var(--transition-fast)',
      }}
    >
      <span style={iconWrapStyle}>{icon}</span>
      <span style={{ flex: 1, fontSize: 'var(--font-size-base)', color: 'var(--text-primary)', fontWeight: 500 }}>
        {label}
      </span>
      <span className={valueClass} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
        {value}
      </span>
      <ChevronRightIcon size={16} color="var(--text-tertiary)" />
    </button>
  );
}

function ActionRow({
  icon,
  label,
  labelColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        padding: 'var(--space-4)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'start',
        fontFamily: 'var(--font-family)',
        transition: 'background var(--transition-fast)',
      }}
    >
      <span style={iconWrapStyle}>{icon}</span>
      <span style={{ flex: 1, fontSize: 'var(--font-size-base)', color: labelColor ?? 'var(--text-primary)', fontWeight: 500 }}>
        {label}
      </span>
      <ChevronRightIcon size={16} color="var(--text-tertiary)" />
    </button>
  );
}

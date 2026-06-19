import { parseISO, differenceInCalendarDays } from 'date-fns';
import type { NotificationPrefs, ExpenseItem } from '../types';

/** Calendar-days from today until a YYYY-MM-DD date (negative if overdue), or null. */
function daysUntil(dateStr: string): number | null {
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return null;
    return differenceInCalendarDays(d, new Date());
  } catch {
    return null;
  }
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/pwa-icon.svg',
        dir: 'rtl',
        lang: 'ar',
      });
      return;
    } catch {
      // fall through to basic Notification
    }
  }
  new Notification(title, { body, icon: '/icons/pwa-icon.svg' });
}

export function defaultNotificationPrefs(): NotificationPrefs {
  return {
    enabled: false,
    weekly: true,
    monthly: true,
    midpoint: true,
    nearWedding: true,
    budgetOverrun: true,
    paymentDue: true,
  };
}

export async function checkAndFireNotifications(
  prefs: NotificationPrefs,
  daysRemaining: number | null,
  budgetPercent: number,
  weddingDate: string,
  expenses: ExpenseItem[] = [],
): Promise<NotificationPrefs> {
  if (!prefs.enabled || Notification.permission !== 'granted') return prefs;

  const now = new Date();
  const lastChecked = prefs.lastChecked ? new Date(prefs.lastChecked) : null;
  const hoursSinceLast = lastChecked
    ? (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60)
    : Infinity;

  if (hoursSinceLast < 12) return prefs;

  const weddingMs = new Date(weddingDate).getTime();
  const totalMs = weddingMs - new Date(weddingDate.slice(0, 4) + '-01-01').getTime();
  const elapsedMs = now.getTime() - (weddingMs - totalMs);
  const midpointPassed = totalMs > 0 && elapsedMs / totalMs >= 0.5;

  if (prefs.weekly) {
    const daysSinceLast = lastChecked
      ? (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    if (daysSinceLast >= 7) {
      await showLocalNotification('احسبها صح', 'لا تنسى تحديث مصروفاتك هذا الأسبوع 📋');
    }
  }

  if (prefs.midpoint && midpointPassed) {
    await showLocalNotification('احسبها صح', 'وصلت لمنتصف الطريق! تحقق من ميزانيتك 🎯');
  }

  if (prefs.nearWedding && daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30) {
    await showLocalNotification(
      'احسبها صح',
      `تبقى ${daysRemaining} يوم على الزواج! تأكد من جهوزية كل شيء 🎊`,
    );
  }

  if (prefs.budgetOverrun && budgetPercent > 100) {
    await showLocalNotification('تنبيه الميزانية', 'لقد تجاوزت الميزانية المحددة ⚠️');
  }

  let next: NotificationPrefs = { ...prefs, lastChecked: now.toISOString() };

  // Payment-due reminder — at most once per calendar day.
  if (prefs.paymentDue !== false) {
    const todayStr = now.toISOString().slice(0, 10);
    const lastPayStr = prefs.paymentDueLastChecked ? prefs.paymentDueLastChecked.slice(0, 10) : '';
    if (lastPayStr !== todayStr) {
      const dueSoon = expenses.filter(e => {
        if (!e.dueDate || (e.status !== 'unpaid' && e.status !== 'partial')) return false;
        const d = daysUntil(e.dueDate);
        return d !== null && d <= 2; // overdue, today, or within 2 days
      });
      if (dueSoon.length === 1) {
        await showLocalNotification('احسبها صح', `عندك دفعة قريبة: ${dueSoon[0].name}`);
        next = { ...next, paymentDueLastChecked: now.toISOString() };
      } else if (dueSoon.length > 1) {
        await showLocalNotification('احسبها صح', `عندك ${dueSoon.length} دفعات قريبة`);
        next = { ...next, paymentDueLastChecked: now.toISOString() };
      }
    }
  }

  return next;
}

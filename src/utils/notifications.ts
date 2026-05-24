import type { NotificationPrefs } from '../types';

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
  };
}

export async function checkAndFireNotifications(
  prefs: NotificationPrefs,
  daysRemaining: number | null,
  budgetPercent: number,
  weddingDate: string,
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

  return { ...prefs, lastChecked: now.toISOString() };
}

/**
 * Push Notifications architecture stub.
 * Prepared for future integration with a push service (FCM / Web Push).
 */

export type PushPermission = NotificationPermission | 'unsupported';

export function getPushSupport(): {
  supported: boolean;
  permission: PushPermission;
  serviceWorker: boolean;
} {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const serviceWorker =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  return {
    supported,
    permission: supported ? Notification.permission : 'unsupported',
    serviceWorker,
  };
}

export async function requestPushPermission(): Promise<PushPermission> {
  const { supported } = getPushSupport();
  if (!supported) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Placeholder for future subscription registration */
export async function registerPushSubscription(): Promise<{
  ok: boolean;
  message: string;
}> {
  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      message: 'Разрешение на уведомления не получено',
    };
  }

  // Architecture ready: here we would create a PushSubscription via
  // registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
  return {
    ok: true,
    message:
      'Разрешение получено. Подписка на push будет доступна после настройки сервера.',
  };
}

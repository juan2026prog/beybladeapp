export class PushService {
  public static async requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notificaciones no soportadas en este navegador.');
    }
    const permission = await Notification.requestPermission();
    return permission;
  }

  public static async getSubscription(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (e) {
      console.warn('Error fetching push subscription:', e);
      return null;
    }
  }

  public static async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Service Worker o Push Manager no soportado en este navegador.');
    }
    
    const registration = await navigator.serviceWorker.ready;
    const convertedKey = this.urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as any
    });

    return subscription;
  }

  public static async unsubscribePush(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        return await subscription.unsubscribe();
      }
    } catch (e) {
      console.error('Error unsubscribing from push:', e);
    }
    return false;
  }

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

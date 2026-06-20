import { useState, useEffect } from 'react';
import { PushService } from '../services/pushService';
import { DbService } from '../services/dbService';

export const usePushNotifications = (userId: string) => {
  const [pushSupported, setPushSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setPushSupported(supported);
      
      if (supported && userId) {
        const sub = await PushService.getSubscription();
        setIsSubscribed(!!sub);
      }
      setLoading(false);
    };

    checkSupport();
  }, [userId]);

  const subscribeUser = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const permission = await PushService.requestPushPermission();
      if (permission !== 'granted') {
        throw new Error('Permiso de notificaciones denegado.');
      }

      // VAPID Public Key (standard generated keys for Web Push, matches supabase env variables)
      const VAPID_PUBLIC_KEY = 'BI5xG6wNqg1h_f0p_c5efS9d8f7g6h5j4k3l2m1n0o9p8q7r6s5t4u3v2w1x0y9z8a7b6c5d4e3f2g1h0'; 
      const subscription = await PushService.subscribeToPush(VAPID_PUBLIC_KEY);

      // Save to Supabase
      await DbService.updateNotificationPreferences(userId, {
        push_enabled: true,
        push_subscription: subscription.toJSON()
      });

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (e) {
      console.error('Error subscribing user:', e);
      setLoading(false);
      throw e;
    }
  };

  const unsubscribeUser = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const success = await PushService.unsubscribePush();
      
      // Update in Supabase
      await DbService.updateNotificationPreferences(userId, {
        push_enabled: false,
        push_subscription: null
      });

      setIsSubscribed(false);
      setLoading(false);
      return success;
    } catch (e) {
      console.error('Error unsubscribing user:', e);
      setLoading(false);
      throw e;
    }
  };

  return {
    pushSupported,
    isSubscribed,
    loading,
    subscribeUser,
    unsubscribeUser
  };
};

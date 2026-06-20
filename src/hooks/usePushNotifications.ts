import { useState, useEffect } from 'react';
import { PushService } from '../services/pushService';
import { DbService } from '../services/dbService';
import { ENV } from '../config/env';

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

      // VAPID Public Key from centralized env configuration
      const VAPID_PUBLIC_KEY = ENV.VAPID_PUBLIC_KEY; 
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

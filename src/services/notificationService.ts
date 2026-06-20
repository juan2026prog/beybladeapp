import { DbService } from './dbService';
import { supabase } from '../lib/supabaseClient';

export interface NotificationPayload {
  title: string;
  message: string;
  url: string;
  points?: number;
  tournamentName?: string;
  journeyName?: string;
}

export class NotificationService {
  /**
   * Main entry point to send notifications to a user based on their preferences
   */
  public static async notifyUser(
    userId: string,
    type: 'new_tournament' | 'new_journey' | 'points_awarded',
    payload: NotificationPayload
  ): Promise<{ inApp: string; push: string; whatsapp: string }> {
    const deliveryReport = { inApp: 'skipped', push: 'skipped', whatsapp: 'skipped' };
    
    try {
      // 1. Fetch preferences
      const prefs = await DbService.getNotificationPreferences(userId);
      if (!prefs) {
        console.warn(`No notification preferences found for user ${userId}. Skipping all channels.`);
        return deliveryReport;
      }

      // 2. Map channels status according to type
      let inAppEnabled = false;
      let pushEnabled = false;
      let whatsappEnabled = false;

      if (type === 'new_tournament') {
        inAppEnabled = prefs.new_tournament_in_app;
        pushEnabled = prefs.new_tournament_push;
        whatsappEnabled = prefs.new_tournament_whatsapp;
      } else if (type === 'new_journey') {
        inAppEnabled = prefs.new_journey_in_app;
        pushEnabled = prefs.new_journey_push;
        whatsappEnabled = prefs.new_journey_whatsapp;
      } else if (type === 'points_awarded') {
        inAppEnabled = prefs.points_awarded_in_app;
        pushEnabled = prefs.points_awarded_push;
        whatsappEnabled = prefs.points_awarded_whatsapp;
      }

      // 3. Process In-App notification
      let createdInAppId: string | null = null;
      if (inAppEnabled) {
        try {
          // Re-map type for notifications table
          let mappedType: 'torneo' | 'inscripcion' | 'resultados' | 'puntos' | 'tiendas' | 'lanzamiento' | 'new_tournament' | 'new_journey' | 'points_awarded' = 'new_tournament';
          if (type === 'new_journey') mappedType = 'new_journey';
          if (type === 'points_awarded') mappedType = 'points_awarded';

          // Insert into notifications
          const { data: notifData, error: notifErr } = await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              title: payload.title,
              message: payload.message,
              type: mappedType,
              is_read: false,
              url: payload.url
            })
            .select('id')
            .single();

          if (notifErr) throw notifErr;
          
          createdInAppId = notifData.id;
          deliveryReport.inApp = 'sent';
          await this.logDelivery(userId, createdInAppId, 'in_app', type, 'sent');
        } catch (err: any) {
          console.error('Error creating in-app notification:', err);
          deliveryReport.inApp = 'failed';
          await this.logDelivery(userId, null, 'in_app', type, 'failed', err.message);
        }
      } else {
        await this.logDelivery(userId, null, 'in_app', type, 'skipped');
      }

      // 4. Process Push Notification
      if (pushEnabled) {
        if (prefs.push_enabled && prefs.push_subscription) {
          try {
            // Call Supabase Edge Function to send Web Push
            const { error: functionError } = await supabase.functions.invoke('send-push', {
              body: {
                user_id: userId,
                title: payload.title,
                message: payload.message,
                url: payload.url,
                type: type
              }
            });

            if (functionError) throw functionError;

            deliveryReport.push = 'sent';
            await this.logDelivery(userId, createdInAppId, 'push', type, 'sent');
          } catch (err: any) {
            console.error('Error sending push notification via Edge Function:', err);
            deliveryReport.push = 'failed';
            await this.logDelivery(userId, createdInAppId, 'push', type, 'failed', err.message);
          }
        } else {
          deliveryReport.push = 'skipped'; // Push is active in preferences but push_enabled is false on device
          await this.logDelivery(userId, createdInAppId, 'push', type, 'skipped', 'Device push not registered or disabled');
        }
      } else {
        await this.logDelivery(userId, createdInAppId, 'push', type, 'skipped');
      }

      // 5. Process WhatsApp Notification
      if (whatsappEnabled) {
        if (prefs.whatsapp_opt_in && prefs.whatsapp_phone) {
          try {
            // Call Supabase Edge Function to send WhatsApp
            const { error: functionError } = await supabase.functions.invoke('send-whatsapp', {
              body: {
                user_id: userId,
                phone: prefs.whatsapp_phone,
                message: payload.message,
                type: type
              }
            });

            if (functionError) throw functionError;

            deliveryReport.whatsapp = 'sent';
            await this.logDelivery(userId, createdInAppId, 'whatsapp', type, 'sent');
          } catch (err: any) {
            console.error('Error sending WhatsApp notification:', err);
            deliveryReport.whatsapp = 'failed';
            await this.logDelivery(userId, createdInAppId, 'whatsapp', type, 'failed', err.message);
          }
        } else {
          deliveryReport.whatsapp = 'skipped'; // WhatsApp active in preferences but no phone or opt_in
          await this.logDelivery(userId, createdInAppId, 'whatsapp', type, 'skipped', 'No verified phone number or opt-in missing');
        }
      } else {
        await this.logDelivery(userId, createdInAppId, 'whatsapp', type, 'skipped');
      }

    } catch (err: any) {
      console.error('General failure in notifyUser service:', err);
    }

    return deliveryReport;
  }

  /**
   * Internal helper to record notification logs
   */
  private static async logDelivery(
    userId: string,
    notificationId: string | null,
    channel: 'in_app' | 'push' | 'whatsapp',
    type: 'new_tournament' | 'new_journey' | 'points_awarded',
    status: 'pending' | 'sent' | 'failed' | 'skipped',
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('notification_delivery_logs')
        .insert({
          user_id: userId,
          notification_id: notificationId,
          channel,
          type,
          status,
          provider: channel === 'whatsapp' ? 'Edge-WhatsApp' : (channel === 'push' ? 'Edge-WebPush' : 'Internal'),
          error_message: errorMessage || null
        });
    } catch (e) {
      console.error('Failed to write delivery log to database:', e);
    }
  }
}

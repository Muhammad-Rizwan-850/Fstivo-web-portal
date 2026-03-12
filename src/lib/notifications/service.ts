/**
 * Updated notification service with multi-channel support
 */

import { sendSMS, sendBulkSMS } from './sms';
import { sendWhatsApp, sendWhatsAppTemplate } from './whatsapp';
import { sendPushToUser, sendBulkPush, type PushNotificationPayload } from './push';

// Export notification types
export type NotificationChannel = 'email' | 'sms' | 'push' | 'whatsapp';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationOptions {
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  scheduledFor?: Date;
}

export class NotificationService {
  async sendEmail(userId: string, notification: any) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user?.email) {
      return { success: false, error: 'User email not found' };
    }

    return { success: true, email: user.email };
  }

  async sendSMS(to: string, message: string) {
    return sendSMS({ to, message });
  }

  async sendWhatsApp(to: string, message: string, mediaUrl?: string) {
    return sendWhatsApp({ to, message, mediaUrl });
  }

  async sendPush(userId: string, payload: PushNotificationPayload) {
    return sendPushToUser(userId, payload);
  }

  async sendMultiChannel(
    userId: string,
    channels: ('email' | 'sms' | 'push' | 'whatsapp')[],
    notification: {
      title: string;
      message: string;
      data?: any;
    }
  ) {
    const promises = [
      channels.includes('email') && this.sendEmail(userId, notification),
      channels.includes('sms') && this.sendSMS(userId, notification.message),
      channels.includes('push') && this.sendPush(userId, {
        title: notification.title,
        body: notification.message,
        data: notification.data,
      }),
      channels.includes('whatsapp') && this.sendWhatsApp(userId, notification.message),
    ].filter(Boolean);

    const results = await Promise.allSettled(promises);

    return {
      total: channels.length,
      results,
    };
  }
}

export const notificationService = new NotificationService();

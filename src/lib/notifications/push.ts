/**
 * Complete Web Push Notification Implementation
 */

import webpush from 'web-push';
import type { NotificationTables } from '@/lib/types/database-additions';
import { logger } from '@/lib/logger';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@fstivo.com';

if (vapidPublicKey && vapidPrivateKey && vapidPublicKey.length > 10) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (error) {
    logger.error('Failed to set VAPID details', error);
  }
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.error('VAPID keys not configured');
    return { success: false, error: 'Push service not configured' };
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    const result = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24,
        urgency: 'high',
      }
    );

    await logPushNotification({
      subscription: subscription.endpoint,
      payload,
      status: 'sent',
      statusCode: result.statusCode,
    });

    return {
      success: true,
      statusCode: result.statusCode,
    };
  } catch (error: any) {
    logger.error('Push notification error:', error);

    if (error.statusCode === 410) {
      await removeExpiredSubscription(subscription.endpoint);
    }

    await logPushNotification({
      subscription: subscription.endpoint,
      payload,
      status: 'failed',
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
    };
  }
}

export async function sendPushToUser(userId: string, payload: PushNotificationPayload) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  // Properly typed query
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true);

  if (!subscriptions || subscriptions.length === 0) {
    return {
      success: false,
      error: 'No active subscriptions found',
    };
  }

  // Properly typed subscriptions
  const results = await Promise.allSettled(
    subscriptions.map((sub: NotificationTables['push_subscriptions']['Row']) =>
      sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      )
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return {
    total: subscriptions.length,
    successful,
    failed,
  };
}

export async function sendBulkPush(userIds: string[], payload: PushNotificationPayload) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushToUser(userId, payload))
  );

  return {
    total: userIds.length,
    results,
  };
}

async function removeExpiredSubscription(endpoint: string) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  // Properly typed update
  await supabase
    .from('push_subscriptions')
    .update({ active: false } as NotificationTables['push_subscriptions']['Update'])
    .eq('endpoint', endpoint);
}

async function logPushNotification(data: {
  subscription: string;
  payload: any;
  status: 'sent' | 'failed';
  statusCode?: number;
  error?: string;
}) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  // Properly typed insert
  const logEntry: NotificationTables['push_logs']['Insert'] = {
    subscription_endpoint: data.subscription,
    payload: data.payload,
    status: data.status,
    status_code: data.statusCode || null,
    error: data.error || null,
    sent_at: new Date().toISOString(),
  };

  await supabase.from('push_logs').insert(logEntry);
}

/**
 * Complete WhatsApp Implementation via Twilio
 */

import twilio from 'twilio';
import type { NotificationTables } from '@/lib/types/database-additions';
import { logger } from '@/lib/logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface WhatsAppOptions {
  to: string;
  message: string;
  mediaUrl?: string;
}

export async function sendWhatsApp({ to, message, mediaUrl }: WhatsAppOptions) {
  if (!client) {
    logger.error('Twilio client not configured');
    return { success: false, error: 'WhatsApp service not configured' };
  }

  try {
    const whatsappNumber = to.startsWith('whatsapp:') ? to : 'whatsapp:' + to;
    const fromWhatsApp = 'whatsapp:' + fromNumber;

    const messageOptions: any = {
      body: message,
      from: fromWhatsApp,
      to: whatsappNumber,
    };

    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl];
    }

    const result = await client.messages.create(messageOptions);

    await logWhatsApp({
      recipient: to,
      message,
      messageId: result.sid,
      status: result.status as 'sent' | 'failed' | 'delivered' | 'read',
      mediaUrl,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status as 'sent' | 'failed' | 'delivered' | 'read',
    };
  } catch (error: any) {
    logger.error('WhatsApp send error:', error);
    
    await logWhatsApp({
      recipient: to,
      message,
      status: 'failed',
      error: error.message,
      mediaUrl,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  variables,
}: {
  to: string;
  templateName: string;
  variables: Record<string, string>;
}) {
  if (!client) {
    return { success: false, error: 'WhatsApp service not configured' };
  }

  try {
    const result = await client.messages.create({
      from: 'whatsapp:' + fromNumber,
      to: 'whatsapp:' + to,
      contentSid: templateName,
      contentVariables: JSON.stringify(variables),
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function logWhatsApp(data: {
  recipient: string;
  message: string;
  messageId?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  mediaUrl?: string;
  error?: string;
}) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  // Properly typed insert
  const logEntry: NotificationTables['whatsapp_logs']['Insert'] = {
    recipient: data.recipient,
    message: data.message,
    message_id: data.messageId || null,
    status: data.status,
    media_url: data.mediaUrl || null,
    error: data.error || null,
    sent_at: new Date().toISOString(),
  };

  await supabase.from('whatsapp_logs').insert(logEntry);
}

/**
 * Complete Twilio SMS Implementation
 */

import twilio from 'twilio';
import type { NotificationTables } from '@/lib/types/database-additions';
import { isValidPhone } from '@/lib/utils';
import { logger } from '@/lib/logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

function mapTwilioStatus(twilioStatus: string): 'sent' | 'delivered' | 'failed' | 'queued' | 'sending' | 'undelivered' {
  switch (twilioStatus) {
    case 'delivered':
      return 'delivered';
    case 'failed':
    case 'undelivered':
      return 'undelivered';
    case 'queued':
    case 'scheduled':
      return 'queued';
    case 'sending':
      return 'sending';
    case 'sent':
    case 'received':
    default:
      return 'sent';
  }
}

export interface SMSOptions {
  to: string;
  message: string;
  priority?: 'high' | 'normal';
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export async function sendSMS({ to, message, priority = 'normal' }: SMSOptions): Promise<SMSResult> {
  if (!client) {
    logger.error('Twilio client not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    if (!isValidPhone(to)) {
      throw new Error('Invalid Pakistani phone number format. Use +92XXXXXXXXXX or 03XXXXXXXXX');
    }

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
      statusCallback: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/twilio/status',
    });

    await logSMS({
      recipient: to,
      message,
      messageId: result.sid,
      status: mapTwilioStatus(result.status),
      priority,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status as string,
    };
  } catch (error: any) {
    logger.error('SMS send error:', error);
    
    await logSMS({
      recipient: to,
      message,
      status: 'failed',
      error: error.message,
      priority,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendBulkSMS(recipients: string[], message: string) {
  const results = await Promise.allSettled(
    recipients.map(to => sendSMS({ to, message }))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return {
    total: recipients.length,
    successful,
    failed,
    results,
  };
}

async function logSMS(data: {
  recipient: string;
  message: string;
  messageId?: string;

  
  status: 'sent' | 'delivered' | 'failed' | 'queued' | 'sending' | 'undelivered';
  error?: string;
  priority?: string;
}) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  // Properly typed insert
  const logEntry: NotificationTables['sms_logs']['Insert'] = {
    recipient: data.recipient,
    message: data.message,
    message_id: data.messageId || null,
    status: mapTwilioStatus(data.status || 'sent'),
    error: data.error || null,
    priority: data.priority || 'normal',
    sent_at: new Date().toISOString(),
  };

  await supabase.from('sms_logs').insert(logEntry);
}

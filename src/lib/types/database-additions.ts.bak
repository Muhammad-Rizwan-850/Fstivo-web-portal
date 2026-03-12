import { Database } from './database';

// Extend database types with notification tables
export type NotificationTables = {
  sms_logs: {
    Row: {
      id: string;
      recipient: string;
      message: string;
      message_id: string | null;
      status: 'sent' | 'delivered' | 'failed' | 'queued' | 'sending' | 'undelivered';
      error: string | null;
      priority: string;
      sent_at: string;
      delivered_at: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      recipient: string;
      message: string;
      message_id?: string | null;
      status: 'sent' | 'delivered' | 'failed' | 'queued' | 'sending' | 'undelivered';
      error?: string | null;
      priority?: string;
      sent_at?: string;
      delivered_at?: string | null;
      created_at?: string;
    };
    Update: Partial<NotificationTables['sms_logs']['Insert']>;
  };
  whatsapp_logs: {
    Row: {
      id: string;
      recipient: string;
      message: string;
      message_id: string | null;
      status: 'sent' | 'delivered' | 'read' | 'failed';
      media_url: string | null;
      error: string | null;
      sent_at: string;
      delivered_at: string | null;
      read_at: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      recipient: string;
      message: string;
      message_id?: string | null;
      status: 'sent' | 'delivered' | 'read' | 'failed';
      media_url?: string | null;
      error?: string | null;
      sent_at?: string;
      delivered_at?: string | null;
      read_at?: string | null;
      created_at?: string;
    };
    Update: Partial<NotificationTables['whatsapp_logs']['Insert']>;
  };
  push_logs: {
    Row: {
      id: string;
      subscription_endpoint: string;
      payload: any;
      status: 'sent' | 'failed';
      status_code: number | null;
      error: string | null;
      sent_at: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      subscription_endpoint: string;
      payload: any;
      status: 'sent' | 'failed';
      status_code?: number | null;
      error?: string | null;
      sent_at?: string;
      created_at?: string;
    };
    Update: Partial<NotificationTables['push_logs']['Insert']>;
  };
  push_subscriptions: {
    Row: {
      id: string;
      user_id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      active: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<NotificationTables['push_subscriptions']['Insert']>;
  };
};

// Merge with existing database types
export type ExtendedDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & NotificationTables;
  };
};

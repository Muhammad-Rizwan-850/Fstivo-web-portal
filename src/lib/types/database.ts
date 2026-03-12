// Database type definitions

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Generic table row type that allows any table structure
export type TableRow = {
  [key: string]: Json | undefined;
};

export type TableInsert = {
  [key: string]: Json | undefined;
};

export type TableUpdate = Partial<TableInsert>;

export interface Database {
  public: {
    Tables: {
      // Specific table definitions for type safety where needed
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'attendee' | 'organizer' | 'volunteer' | 'sponsor' | 'admin' | 'super_admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role?: 'attendee' | 'organizer' | 'volunteer' | 'sponsor' | 'admin' | 'super_admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'attendee' | 'organizer' | 'volunteer' | 'sponsor' | 'admin' | 'super_admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          start_date: string;
          end_date: string;
          location: string;
          organizer_id: string;
          status: 'draft' | 'published' | 'cancelled' | 'completed';
          capacity: number;
          banner_url: string | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          start_date: string;
          end_date: string;
          location: string;
          organizer_id: string;
          status?: 'draft' | 'published' | 'cancelled' | 'completed';
          capacity: number;
          banner_url?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          start_date?: string;
          end_date?: string;
          location?: string;
          organizer_id?: string;
          status?: 'draft' | 'published' | 'cancelled' | 'completed';
          capacity?: number;
          banner_url?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          tier_id: string;
          order_id: string;
          seat_id: string | null;
          qr_code: string;
          status: 'active' | 'used' | 'cancelled' | 'transferred';
          checked_in: boolean;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          tier_id: string;
          order_id: string;
          seat_id?: string | null;
          qr_code?: string;
          status?: 'active' | 'used' | 'cancelled' | 'transferred';
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          tier_id?: string;
          order_id?: string;
          seat_id?: string | null;
          qr_code?: string;
          status?: 'active' | 'used' | 'cancelled' | 'transferred';
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: 'active' | 'cancelled' | 'expired' | 'past_due';
          current_period_start: string;
          current_period_end: string;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: 'active' | 'cancelled' | 'expired' | 'past_due';
          current_period_start: string;
          current_period_end: string;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: 'active' | 'cancelled' | 'expired' | 'past_due';
          current_period_start?: string;
          current_period_end?: string;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_event_analytics: {
        Args: { event_id: string };
        Returns: Json;
      };
      events_nearby: {
        Args: { lat: number; lng: number; radius_km: number };
        Returns: Json[];
      };
      increment_ad_impressions: {
        Args: { ad_id: string };
        Returns: void;
      };
      increment_ad_clicks: {
        Args: { ad_id: string };
        Returns: void;
      };
      get_affiliate_leaderboard: {
        Args: { start_date: string };
        Returns: Json[];
      };
    };
    Enums: {
      user_role: 'attendee' | 'organizer' | 'volunteer' | 'sponsor' | 'admin' | 'super_admin';
      event_status: 'draft' | 'published' | 'cancelled' | 'completed';
      ticket_status: 'active' | 'used' | 'cancelled' | 'transferred';
      subscription_status: 'active' | 'cancelled' | 'expired' | 'past_due';
    };
  };
}

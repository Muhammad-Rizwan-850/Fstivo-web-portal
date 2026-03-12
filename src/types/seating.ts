// Seating Types
export interface SeatingChart {
  id: string;
  venue_id: string;
  name: string;
  configuration: SeatingConfiguration;
  total_seats: number;
  available_seats: number;
  created_at: string;
  updated_at: string;
}

export interface SeatingConfiguration {
  rows: number;
  columns: number;
  sections: SeatingSection[];
  seats: Seat[];
}

export interface SeatingSection {
  id: string;
  name: string;
  section_name?: string;
  section_type?: string;
  type: 'general' | 'vip' | 'premium';
  price_multiplier: number;
  base_price?: number;
  capacity?: number;
  position?: number;
  color?: string;
  row_count?: number;
  seats_per_row?: number;
  seat_labels_pattern?: string;
  row_start: number;
  row_end: number;
  col_start: number;
  col_end: number;
}

export interface Seat {
  id: string;
  row: number;
  column: number;
  section: string;
  status: 'available' | 'reserved' | 'sold';
  price: number;
  type: 'general' | 'vip' | 'premium';
  seat_number?: string;
  row_label?: string;
  column_number?: number;
  is_accessible?: boolean;
  position?: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity: number;
  has_seating: boolean;
  created_at: string;
}

export interface SeatingLayout {
  id: string;
  event_id: string;
  venue_id: string;
  layout_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeatReservation {
  id: string;
  event_id: string;
  user_id: string;
  seat_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface SeatPricingTier {
  id: string;
  event_id: string;
  section_type: string;
  base_price: number;
  multiplier: number;
  created_at: string;
}

export interface AccessibilityRequest {
  id: string;
  event_id: string;
  user_id: string;
  request_type: string;
  status: 'pending' | 'approved' | 'denied';
  notes?: string;
  created_at: string;
}

export interface GroupSeating {
  id: string;
  event_id: string;
  group_name: string;
  seats: string[];
  coordinator_id: string;
  created_at: string;
}

export interface SeatHold {
  id: string;
  event_id: string;
  user_id: string;
  seat_ids: string[];
  expires_at: string;
  created_at: string;
}

export interface SeatingConfigHistory {
  id: string;
  event_id: string;
  config_data: Record<string, any>;
  changed_by: string;
  change_reason: string;
  created_at: string;
}

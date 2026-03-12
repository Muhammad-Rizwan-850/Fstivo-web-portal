export interface Type {
  id: string;
  created_at: string;
  updated_at: string;
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'whatsapp';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationSendRequest {
  notificationType: string;
  channels?: NotificationChannel[];
  data: unknown;
  priority?: NotificationPriority;
  scheduledFor?: string | Date | undefined;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Showcase / Team & Volunteers types
export interface SkillInput {
  name: string;
  level?: string;
  years?: number;
}

export interface SocialLinkInput {
  platform: string;
  url: string;
  username?: string;
}

export interface TeamMemberInput {
  name: string;
  role?: string;
  department?: string;
  bio?: string;
  profile_image_url?: string;
  email?: string;
  phone?: string;
  location?: string;
  joined_date?: string;
  is_featured?: boolean;
  display_order?: number;
  stats?: Record<string, number>;
  skills?: SkillInput[];
  social_links?: SocialLinkInput[];
}

export interface VolunteerInput {
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  profile_image_url?: string;
  bio?: string;
  skills?: SkillInput[];
  interests?: string[];
  total_points?: number;
  is_featured?: boolean;
}

export interface ShowcaseTeamVolunteerResult {
  stats: Record<string, unknown>;
  team?: unknown[];
  volunteers?: unknown[];
  levels?: unknown[];
  appreciation?: unknown[];
  badges?: unknown[];
}

// Past events types
export interface GalleryImage {
  url: string;
  caption?: string;
}

export interface TestimonialInput {
  name: string;
  role?: string;
  university?: string;
  text: string;
  rating?: number;
  is_featured?: boolean;
}

export interface PastEventInput {
  event_id?: string;
  title: string;
  description?: string;
  date?: string;
  year?: number;
  location?: string;
  category?: string;
  attendees_count?: number;
  rating?: number;
  featured_image?: string;
  video_url?: string;
  highlights?: string;
  is_featured?: boolean;
  gallery_images?: GalleryImage[];
  testimonials?: TestimonialInput[];
}

// Community partner types
export interface CollaborationInput {
  text: string;
}

export interface JointEventInput {
  name: string;
  date?: string;
  attendees?: number;
  description?: string;
}

export interface ImpactMetricInput {
  name: string;
  value: string | number;
}

export interface PartnerTestimonialInput {
  text: string;
  author?: string;
  position?: string;
  is_featured?: boolean;
}

// Sponsor types
export interface SponsorImpactMetricInput {
  metric_name: string;
  metric_value: string | number;
  metric_label?: string;
}

export interface SponsorTestimonialInput {
  text: string;
  author?: string;
  position?: string;
  is_featured?: boolean;
}

export interface SponsorStoryInput {
  title: string;
  achievement?: string;
  details?: string;
  date?: string;
  is_featured?: boolean;
}

// University network types
export interface UniversityCampusInput {
  campus_city: string;
}

export interface UniversityAchievementInput {
  text: string;
  date?: string;
}

export interface StudentOrgInput {
  name: string;
  members?: number;
  description?: string;
}

// Events stats types
export interface RegistrationRecord {
  status: string;
  checked_in_at?: string | null;
  payment_status?: string;
  amount_paid?: number;
}

// Email-related types
export interface RegistrationWithRelations {
  id: string;
  registration_number?: string;
  total_amount?: number;
  checked_in_at?: string | null;
  event?: { title?: string; start_date?: string; venue_name?: string; venue_city?: string };
  ticket_type?: { name?: string };
  user?: { email?: string; first_name?: string; last_name?: string };
  [key: string]: unknown;
}

export interface VolunteerApplicationWithRelations {
  id: string;
  preferred_role?: string;
  training_date?: string;
  user?: { email?: string; first_name?: string; last_name?: string };
  event?: { title?: string; start_date?: string; venue_name?: string; venue_city?: string };
  [key: string]: unknown;
}

export interface PayoutWithRelations {
  id: string;
  amount?: number;
  payment_method?: string;
  reference_number?: string;
  updated_at?: string;
  recipient?: { email?: string; first_name?: string; last_name?: string };
  [key: string]: unknown;
}

// Event-related types
export interface EventWithRelations {
  id: string;
  title?: string;
  start_date?: string;
  organizer_id?: string;
  users?: { first_name?: string; last_name?: string };
  [key: string]: unknown;
}

export interface RegistrationForEmail {
  user?: { email?: string };
  [key: string]: unknown;
}
// AI Matching types
export interface VolunteerProfile {
  id: string;
  full_name?: string;
  skills?: unknown[];
  experience?: unknown;
  bio?: string;
  location?: unknown;
  availability?: unknown[];
}

export interface VolunteerMatch {
  id: string;
  full_name?: string;
  skills?: unknown[];
  experience?: unknown;
  bio?: string;
  location?: unknown;
  availability?: unknown[];
}

// AB Testing types
export interface ABTestVariant {
  id?: string;
  name?: string;
  description?: string;
  weight?: number;
  config?: Record<string, unknown>;
  metrics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    revenue?: number;
    custom_metrics?: Record<string, number>;
  };
}

export interface ABTestInput {
  name?: string;
  description?: string;
  campaign_id?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  target_metric?: string;
  variants?: ABTestVariant[];
}

// Social types
export interface GroupInput {
  name: string;
  description?: string;
  category?: string;
  privacy?: 'public' | 'private';
  rules?: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at?: string;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at?: string;
}

// Notification types
export interface NotificationHistoryEntry {
  id: string;
  user_id?: string;
  notification_types?: { display_name?: string; name?: string; category?: string; icon?: string };
  notification_channels?: { name?: string; display_name?: string; icon?: string };
  recipient?: string;
  subject?: string;
  body?: string;
  status?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  external_id?: string;
}

// Event types
export interface EventWithTicketTypes {
  id: string;
  title?: string;
  category?: { id?: string; name?: string; slug?: string; icon?: string };
  field?: { id?: string; name?: string; slug?: string };
  organizer?: { id?: string; full_name?: string; avatar_url?: string; email?: string };
  organization?: { id?: string; name?: string; logo_url?: string };
  deleted_at?: unknown;
  [key: string]: unknown;
}

export interface TicketType {
  id: string;
  event_id: string;
  name?: string;
  price?: number;
  quantity?: number;
  deleted_at?: unknown;
}

// Message types
export interface MessageData {
  id: string;
  read_at?: string;
  recipient_id?: string;
  [key: string]: unknown;
}

// Connection types
export interface ConnectionData {
  id: string;
  status: 'accepted' | 'rejected' | 'pending';
  connected_user_id?: string;
  [key: string]: unknown;
}

// Verification types
export interface ChannelData {
  id: string;
  name?: string;
}

export interface VerificationRequestData {
  user_id: string;
  channel_id: string;
  contact_value: string;
  is_verified?: boolean;
  verification_token?: string;
  verification_sent_at?: string;
}

// Ad types
export interface AdCampaign {
  id: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  spent_amount?: number;
  total_budget?: number;
  start_date?: string;
  end_date?: string;
}

export interface AdMetrics {
  id: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

export interface AdData {
  id: string;
  advertiser_id?: string;
  campaign?: AdCampaign;
  metrics?: AdMetrics;
  [key: string]: unknown;
}

export interface AdServing {
  id: string;
  priority?: number;
  campaign?: AdCampaign;
  [key: string]: unknown;
}

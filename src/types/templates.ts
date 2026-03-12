// Templates Types
export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url: string;
  is_public: boolean;
  creator_id: string;
  usage_count: number;
  rating: number;
  template_data: {
    title: string;
    description_template: string;
    default_ticket_types: TicketTypeTemplate[];
    default_settings: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
}

export interface TicketTypeTemplate {
  name: string;
  description: string;
  price: number;
  quantity: number;
  max_per_order: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
}

export interface TemplateReview {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  templates: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventSeries {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  template_id: string;
  events: string[];
  schedule: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCloneHistory {
  id: string;
  original_event_id: string;
  cloned_event_id: string;
  template_used: string;
  cloned_by: string;
  changes_made: Record<string, any>;
  created_at: string;
}

export interface TemplateTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TemplateCategoryMapping {
  id: string;
  template_id: string;
  category_id: string;
  created_at: string;
}

export interface TemplateUsageAnalytics {
  id: string;
  template_id: string;
  event_id: string;
  user_id: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Event Templates Query Functions
 * Database queries for event templates, cloning, and event series
 */

import { createClient } from '@/lib/auth/config'
import type {
  EventTemplate,
  TemplateReview,
  TemplateCollection,
  EventSeries,
  EventCloneHistory,
  TemplateCategory,
  TemplateTag,
  TemplateCategoryMapping,
  TemplateUsageAnalytics
} from '@/types/templates'

// ============================================================================
// EVENT TEMPLATES
// ============================================================================

export async function getEventTemplates(options?: {
  userId?: string
  isPublic?: boolean
  category?: string
  tags?: string[]
  featured?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('event_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.userId) {
    query = query.or(`created_by.eq.${options.userId},is_public.eq.true`)
  } else if (options?.isPublic !== undefined) {
    query = query.eq('is_public', options.isPublic)
  }

  if (options?.featured) {
    query = query.eq('is_featured', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as EventTemplate[]
}

export async function getEventTemplate(templateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) throw error
  return data as EventTemplate
}

export async function createEventTemplate(
  userId: string,
  templateData: {
    templateName: string
    description?: string
    category?: string
    eventType: string
    templateData: Record<string, any>
    thumbnailUrl?: string
    isPublic?: boolean
    tags?: string[]
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('event_templates') as any)
    .insert({
      created_by: userId,
      template_name: templateData.templateName,
      description: templateData.description,
      category: templateData.category,
      event_type: templateData.eventType,
      template_data: templateData.templateData as any,
      thumbnail_url: templateData.thumbnailUrl,
      is_public: templateData.isPublic || false,
      tags: templateData.tags || []
    })
    .select()
    .single()

  if (error) throw error
  return data as EventTemplate
}

export async function updateEventTemplate(
  templateId: string,
  updates: Partial<EventTemplate>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('event_templates') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error
  return data as EventTemplate
}

export async function deleteEventTemplate(templateId: string) {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('event_templates') as any)
    .delete()
    .eq('id', templateId)

  if (error) throw error
}

export async function incrementTemplateUsage(templateId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('event_templates') as any)
    .update({
      usage_count: (supabase as any).raw('usage_count + 1')
    })
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error
  return data as EventTemplate
}

export async function searchTemplates(searchTerm: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_templates')
    .select('*')
    .or(`template_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
    .eq('is_public', true)
    .order('usage_count', { ascending: false })

  if (error) throw error
  return data as EventTemplate[]
}

// ============================================================================
// TEMPLATE REVIEWS
// ============================================================================

export async function getTemplateReviews(templateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('template_reviews')
    .select('*, profiles(first_name, last_name)')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createTemplateReview(
  templateId: string,
  userId: string,
  reviewData: {
    rating: number
    reviewText?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('template_reviews') as any)
    .insert({
      template_id: templateId,
      user_id: userId,
      rating: reviewData.rating,
      review_text: reviewData.reviewText
    })
    .select()
    .single()

  if (error) throw error
  return data as TemplateReview
}

export async function updateTemplateRating(templateId: string) {
  const supabase = await createClient()

  // Calculate new average rating
  const { data: reviews } = await (supabase
    .from('template_reviews') as any)
    .select('rating')
    .eq('template_id', templateId)

  if (!reviews || reviews.length === 0) return

  const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length

  await (supabase
    .from('event_templates') as any)
    .update({
      rating: averageRating,
      review_count: reviews.length
    })
    .eq('id', templateId)
}

// ============================================================================
// TEMPLATE COLLECTIONS
// ============================================================================

export async function getTemplateCollections(userId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('template_collections')
    .select('*')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.or(`created_by.eq.${userId},is_public.eq.true`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as TemplateCollection[]
}

export async function getTemplateCollection(collectionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('template_collections')
    .select('*')
    .eq('id', collectionId)
    .single()

  if (error) throw error
  return data as TemplateCollection
}

export async function createTemplateCollection(
  userId: string,
  collectionData: {
    collectionName: string
    description?: string
    isPublic?: boolean
    templateIds: string[]
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('template_collections') as any)
    .insert({
      created_by: userId,
      collection_name: collectionData.collectionName,
      description: collectionData.description,
      is_public: collectionData.isPublic || false,
      template_ids: collectionData.templateIds
    })
    .select()
    .single()

  if (error) throw error
  return data as TemplateCollection
}

export async function updateTemplateCollection(
  collectionId: string,
  updates: Partial<TemplateCollection>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('template_collections') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) throw error
  return data as TemplateCollection
}

// ============================================================================
// EVENT SERIES (Recurring Events)
// ============================================================================

export async function getEventSeries(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_series')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as EventSeries[]
}

export async function getEventSeriesDetails(seriesId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_series')
    .select('*, events(*)')
    .eq('id', seriesId)
    .single()

  if (error) throw error
  return data
}

export async function createEventSeries(
  userId: string,
  seriesData: {
    seriesName: string
    description?: string
    recurrencePattern: Record<string, any>
    parentEventId?: string
    startDate: Date
    endDate?: Date
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('event_series') as any)
    .insert({
      created_by: userId,
      series_name: seriesData.seriesName,
      description: seriesData.description,
      recurrence_pattern: seriesData.recurrencePattern as any,
      parent_event_id: seriesData.parentEventId,
      start_date: seriesData.startDate.toISOString().split('T')[0],
      end_date: seriesData.endDate?.toISOString().split('T')[0]
    })
    .select()
    .single()

  if (error) throw error
  return data as EventSeries
}

export async function addEventToSeries(seriesId: string, eventId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('event_series') as any)
    .update({
      event_ids: (supabase as any).raw('array_append(event_ids, $1)', [eventId])
    })
    .eq('id', seriesId)
    .select()
    .single()

  if (error) throw error
  return data as EventSeries
}

// ============================================================================
// EVENT CLONE HISTORY
// ============================================================================

export async function getCloneHistory(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_clone_history')
    .select('*')
    .eq('original_event_id', eventId)
    .order('cloned_at', { ascending: false })

  if (error) throw error
  return data as EventCloneHistory[]
}

export async function recordEventClone(
  originalEventId: string,
  clonedEventId: string | null,
  clonedBy: string,
  cloneType: 'full' | 'structure_only' | 'with_registrations'
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('event_clone_history') as any)
    .insert({
      original_event_id: originalEventId,
      cloned_event_id: clonedEventId,
      cloned_by: clonedBy,
      clone_type: cloneType
    })
    .select()
    .single()

  if (error) throw error
  return data as EventCloneHistory
}

// ============================================================================
// TEMPLATE CATEGORIES
// ============================================================================

export async function getTemplateCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('template_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data as TemplateCategory[]
}

export async function getTemplateCategory(categoryId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('template_categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  if (error) throw error
  return data as TemplateCategory
}

export async function createTemplateCategory(
  categoryData: {
    categoryName: string
    parentCategoryId?: string
    description?: string
    iconUrl?: string
    displayOrder?: number
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('template_categories') as any)
    .insert({
      category_name: categoryData.categoryName,
      parent_category_id: categoryData.parentCategoryId,
      description: categoryData.description,
      icon_url: categoryData.iconUrl,
      display_order: categoryData.displayOrder || 0
    })
    .select()
    .single()

  if (error) throw error
  return data as TemplateCategory
}

// ============================================================================
// TEMPLATE TAGS
// ============================================================================

export async function getTemplateTags() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('template_tags')
    .select('*')
    .order('tag_name', { ascending: true })

  if (error) throw error
  return data as TemplateTag[]
}

export async function getOrCreateTemplateTag(tagName: string) {
  const supabase = await createClient()

  // Try to get existing tag
  const { data: existing } = await supabase
    .from('template_tags')
    .select('*')
    .eq('tag_name', tagName)
    .single()

  if (existing) {
    return existing as TemplateTag
  }

  // Create new tag
  const { data, error } = await (supabase
    .from('template_tags') as any)
    .insert({ tag_name: tagName })
    .select()
    .single()

  if (error) throw error
  return data as TemplateTag
}

export async function incrementTagUsage(tagId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('template_tags') as any)
    .update({
      usage_count: (supabase as any).raw('usage_count + 1')
    })
    .eq('id', tagId)
    .select()
    .single()

  if (error) throw error
  return data as TemplateTag
}

// ============================================================================
// TEMPLATE CATEGORY MAPPING
// ============================================================================

export async function addTemplateToCategory(
  templateId: string,
  categoryId: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('template_category_mapping') as any)
    .insert({
      template_id: templateId,
      category_id: categoryId
    })
    .select()
    .single()

  if (error) throw error
  return data as TemplateCategoryMapping
}

export async function getTemplatesByCategory(categoryId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('template_category_mapping')
    .select('*, event_templates(*)')
    .eq('category_id', categoryId)

  if (error) throw error
  return data
}

export async function removeTemplateFromCategory(
  templateId: string,
  categoryId: string
) {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('template_category_mapping') as any)
    .delete()
    .eq('template_id', templateId)
    .eq('category_id', categoryId)

  if (error) throw error
}

// ============================================================================
// TEMPLATE USAGE ANALYTICS
// ============================================================================

export async function recordTemplateUsage(
  templateId: string,
  userId: string,
  eventCreatedId?: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('template_usage_analytics') as any)
    .insert({
      template_id: templateId,
      used_by: userId,
      event_created_id: eventCreatedId
    })
    .select()
    .single()

  if (error) throw error
  return data as TemplateUsageAnalytics
}

export async function getTemplateUsageAnalytics(templateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('template_usage_analytics')
    .select('*, profiles(first_name, last_name)')
    .eq('template_id', templateId)
    .order('used_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPopularTemplates(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_templates')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as EventTemplate[]
}

// ============================================================================
// TEMPLATE MARKETPLACE
// ============================================================================

export async function getMarketplaceTemplates(options?: {
  category?: string
  eventType?: string
  tags?: string[]
  search?: string
  minRating?: number
  sortBy?: 'popular' | 'rating' | 'recent'
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('event_templates')
    .select('*, profiles(first_name, last_name), template_categories(*)')
    .eq('is_public', true)

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType)
  }

  if (options?.tags && options.tags.length > 0) {
    query = query.contains('tags', options.tags)
  }

  if (options?.search) {
    query = query.or(`template_name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  if (options?.minRating) {
    query = query.gte('rating', options.minRating)
  }

  switch (options?.sortBy) {
    case 'rating':
      query = query.order('rating', { ascending: false })
      break
    case 'recent':
      query = query.order('created_at', { ascending: false })
      break
    case 'popular':
    default:
      query = query.order('usage_count', { ascending: false })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

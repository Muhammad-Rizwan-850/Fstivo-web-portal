'use server';

/**
 * FSTIVO Caching Strategies
 * Domain-specific caching implementations with smart invalidation
 */

import { cache, CACHE_TTL } from './redis';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// EVENT CACHING STRATEGY
// =====================================================

export interface EventCacheData {
  events: any[];
  total: number;
  page: number;
}

export class EventCacheStrategy {
  private readonly PREFIX = 'event:';

  /**
   * Cache key for event list
   */
  private getListKey(filters: Record<string, any>): string {
    const filterString = JSON.stringify(filters);
    return this.PREFIX + 'list:' + Buffer.from(filterString).toString('base64');
  }

  /**
   * Cache key for single event
   */
  private getEventKey(eventId: string): string {
    return this.PREFIX + 'id:' + eventId;
  }

  /**
   * Cache key for event slug
   */
  private getSlugKey(slug: string): string {
    return this.PREFIX + 'slug:' + slug;
  }

  /**
   * Get cached event list
   */
  async getList(filters: Record<string, any> = {}): Promise<EventCacheData | null> {
    const key = this.getListKey(filters);
    return await cache.get<EventCacheData>(key);
  }

  /**
   * Set cached event list
   */
  async setList(filters: Record<string, any>, data: EventCacheData): Promise<void> {
    const key = this.getListKey(filters);
    await cache.set(key, data, CACHE_TTL.MEDIUM);
  }

  /**
   * Get cached single event
   */
  async getEvent(eventId: string): Promise<any | null> {
    const key = this.getEventKey(eventId);
    return await cache.get(key);
  }

  /**
   * Set cached single event
   */
  async setEvent(eventId: string, data: any): Promise<void> {
    const key = this.getEventKey(eventId);
    await cache.set(key, data, CACHE_TTL.MEDIUM);
  }

  /**
   * Get event by slug
   */
  async getBySlug(slug: string): Promise<any | null> {
    const key = this.getSlugKey(slug);
    return await cache.get(key);
  }

  /**
   * Set event by slug
   */
  async setBySlug(slug: string, data: any): Promise<void> {
    const key = this.getSlugKey(slug);
    await cache.set(key, data, CACHE_TTL.MEDIUM);
  }

  /**
   * Invalidate event cache
   */
  async invalidateEvent(eventId: string): Promise<void> {
    const supabase = createClient();
    const { data: event } = await supabase
      .from('events')
      .select('slug')
      .eq('id', eventId)
      .single();

    if (event?.slug) {
      await cache.del([this.getEventKey(eventId), this.getSlugKey(event.slug)]);
    }
  }

  /**
   * Invalidate all event lists
   */
  async invalidateAllLists(): Promise<void> {
    await cache.mdel(this.PREFIX + 'list:*');
  }
}

// =====================================================
// USER CACHE STRATEGY
// =====================================================

export class UserCacheStrategy {
  private readonly PREFIX = 'user:';

  private getUserKey(userId: string): string {
    return this.PREFIX + 'id:' + userId;
  }

  private getEmailKey(email: string): string {
    return this.PREFIX + 'email:' + email;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<any | null> {
    const key = this.getUserKey(userId);
    return await cache.get(key);
  }

  /**
   * Set user profile
   */
  async setProfile(userId: string, data: any): Promise<void> {
    const key = this.getUserKey(userId);
    await cache.set(key, data, CACHE_TTL.MEDIUM);
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<any | null> {
    const key = this.getEmailKey(email);
    return await cache.get(key);
  }

  /**
   * Invalidate user cache
   */
  async invalidate(userId: string): Promise<void> {
    await cache.del(this.getUserKey(userId));
  }
}

// =====================================================
// ANALYTICS CACHE STRATEGY
// =====================================================

export class AnalyticsCacheStrategy {
  private readonly PREFIX = 'analytics:';

  /**
   * Get dashboard stats with hourly cache
   */
  async getDashboardStats(userId: string): Promise<any | null> {
    const key = this.PREFIX + 'dashboard:' + userId;
    return await cache.get(key);
  }

  /**
   * Set dashboard stats
   */
  async setDashboardStats(userId: string, data: any): Promise<void> {
    const key = this.PREFIX + 'dashboard:' + userId;
    await cache.set(key, data, CACHE_TTL.LONG);
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId: string): Promise<any | null> {
    const key = this.PREFIX + 'event:' + eventId;
    return await cache.get(key);
  }

  /**
   * Set event analytics
   */
  async setEventAnalytics(eventId: string, data: any): Promise<void> {
    const key = this.PREFIX + 'event:' + eventId;
    await cache.set(key, data, CACHE_TTL.LONG);
  }

  /**
   * Invalidate analytics on event update
   */
  async invalidateEvent(eventId: string): Promise<void> {
    await cache.del(this.PREFIX + 'event:' + eventId);
  }
}

// =====================================================
// SEARCH CACHE STRATEGY
// =====================================================

export class SearchCacheStrategy {
  private readonly PREFIX = 'search:';

  private getSearchKey(query: string, filters: Record<string, any>): string {
    const filterString = JSON.stringify(filters);
    const hash = Buffer.from(query + filterString).toString('base64').substring(0, 32);
    return this.PREFIX + hash;
  }

  /**
   * Get cached search results
   */
  async getResults(query: string, filters: Record<string, any> = {}): Promise<any[] | null> {
    const key = this.getSearchKey(query, filters);
    return await cache.get(key);
  }

  /**
   * Set cached search results
   */
  async setResults(query: string, filters: Record<string, any>, results: any[]): Promise<void> {
    const key = this.getSearchKey(query, filters);
    await cache.set(key, results, CACHE_TTL.SHORT);
  }

  /**
   * Invalidate search cache (called on data changes)
   */
  async invalidate(): Promise<void> {
    await cache.mdel(this.PREFIX + '*');
  }
}

// =====================================================
// EXPORTS
// =====================================================

export const strategies = {
  event: new EventCacheStrategy(),
  user: new UserCacheStrategy(),
  analytics: new AnalyticsCacheStrategy(),
  search: new SearchCacheStrategy(),
};

export default strategies;

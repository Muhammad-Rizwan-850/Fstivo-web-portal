// =====================================================
// SPONSOR-EVENT MATCHMAKING (AI-POWERED)
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface SponsorProfile {
  id: string;
  userId: string;
  companyName: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  interestedCategories?: string[];
  interestedCities?: string[];
  budgetRange?: {
    min: number;
    max: number;
  };
  sponsorshipTypes?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface SponsorMatch {
  eventId: string;
  eventName: string;
  sponsorId: string;
  sponsorName: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  sponsorshipTypes: string[];
  estimatedBudget: number;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface MatchCriteria {
  categories?: string[];
  cities?: string[];
  budgetMin?: number;
  budgetMax?: number;
  sponsorshipTypes?: string[];
  attendeeCount?: number;
}

/**
 * Calculate match score between event and sponsor
 */
export async function calculateMatchScore(
  eventId: string,
  sponsorId: string
): Promise<number> {
  try {
    const supabase = await createServerClient();

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    // Get sponsor profile
    const { data: sponsor } = await supabase
      .from('sponsor_profiles')
      .select('*')
      .eq('id', sponsorId)
      .single();

    if (!event || !sponsor) {
      return 0;
    }

    let score = 0;
    const maxScore = 100;

    // Category matching (40 points)
    if (sponsor.interested_categories && sponsor.interested_categories.length > 0) {
      const eventCategories = [event.category]; // Assuming event has category field
      const matchingCategories = sponsor.interested_categories.filter((cat: string) =>
        eventCategories.includes(cat)
      );
      score += (matchingCategories.length / sponsor.interested_categories.length) * 40;
    } else {
      score += 20; // Neutral score if no preferences
    }

    // Location matching (20 points)
    if (sponsor.interested_cities && sponsor.interested_cities.length > 0) {
      if (sponsor.interested_cities.includes(event.city || '')) {
        score += 20;
      } else if (sponsor.interested_cities.includes('all')) {
        score += 15;
      }
    } else {
      score += 10;
    }

    // Budget alignment (20 points)
    if (sponsor.budget_range) {
      const estimatedCost = event.estimated_budget || 0;
      if (estimatedCost >= sponsor.budget_range.min && estimatedCost <= sponsor.budget_range.max) {
        score += 20;
      } else if (estimatedCost < sponsor.budget_range.min) {
        score += 10; // Under budget, might still be interested
      }
    } else {
      score += 10;
    }

    // Attendee count relevance (10 points)
    if (event.max_attendees) {
      const attendeeCount = event.max_attendees;
      if (attendeeCount > 1000) {
        score += 10; // Large events are attractive to sponsors
      } else if (attendeeCount > 500) {
        score += 7;
      } else if (attendeeCount > 100) {
        score += 5;
      }
    }

    // Event type relevance (10 points)
    if (sponsor.sponsorship_types && sponsor.sponsorship_types.length > 0) {
      // This would need more sophisticated logic based on event type
      score += 5;
    }

    return Math.min(Math.round(score), maxScore);
  } catch (error) {
    logger.error('Error calculating match score:', error);
    return 0;
  }
}

/**
 * Find sponsors for an event
 */
export async function findSponsorsForEvent(
  eventId: string,
  criteria?: MatchCriteria
): Promise<SponsorMatch[]> {
  try {
    const supabase = await createServerClient();

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) {
      return [];
    }

    // Build query for sponsors
    let query = supabase
      .from('sponsor_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters if criteria provided
    if (criteria?.categories && criteria.categories.length > 0) {
      query = query.contains('interested_categories', criteria.categories);
    }

    if (criteria?.cities && criteria.cities.length > 0) {
      query = query.contains('interested_cities', criteria.cities);
    }

    if (criteria?.budgetMin) {
      query = query.gte('budget_range->>min', criteria.budgetMin);
    }

    if (criteria?.budgetMax) {
      query = query.lte('budget_range->>max', criteria.budgetMax);
    }

    const { data: sponsors, error } = await query;

    if (error) {
      logger.error('Error finding sponsors:', error);
      return [];
    }

    // Calculate match scores for each sponsor
    const matches: SponsorMatch[] = [];

    for (const sponsor of sponsors || []) {
      const score = await calculateMatchScore(eventId, sponsor.id);

      // Only include matches with score > 50
      if (score >= 50) {
        const matchReasons = generateMatchReasons(event, sponsor, score);

        matches.push({
          eventId,
          eventName: event.title,
          sponsorId: sponsor.id,
          sponsorName: sponsor.company_name,
          matchScore: score,
          matchReasons,
          sponsorshipTypes: sponsor.sponsorship_types || [],
          estimatedBudget: sponsor.budget_range?.max || 0,
          contactInfo: {
            name: sponsor.contact_name || 'Contact',
            email: sponsor.contact_email || '',
            phone: sponsor.contact_phone,
          },
        });
      }
    }

    // Sort by match score descending
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    logger.error('Error finding sponsors for event:', error);
    return [];
  }
}

/**
 * Find events for a sponsor
 */
export async function findEventsForSponsor(
  sponsorId: string
): Promise<SponsorMatch[]> {
  try {
    const supabase = await createServerClient();

    // Get sponsor profile
    const { data: sponsor } = await supabase
      .from('sponsor_profiles')
      .select('*')
      .eq('id', sponsorId)
      .single();

    if (!sponsor) {
      return [];
    }

    // Get events matching sponsor's interests
    let query = supabase
      .from('events')
      .select('*')
      .gte('start_date', new Date().toISOString()) // Only future events
      .order('start_date', { ascending: true });

    if (sponsor.interested_categories && sponsor.interested_categories.length > 0) {
      query = query.in('category', sponsor.interested_categories);
    }

    if (sponsor.interested_cities && sponsor.interested_cities.length > 0) {
      if (!sponsor.interested_cities.includes('all')) {
        query = query.in('city', sponsor.interested_cities);
      }
    }

    const { data: events, error } = await query.limit(50);

    if (error) {
      logger.error('Error finding events:', error);
      return [];
    }

    // Calculate match scores
    const matches: SponsorMatch[] = [];

    for (const event of events || []) {
      const score = await calculateMatchScore(event.id, sponsorId);

      if (score >= 50) {
        const matchReasons = generateMatchReasons(event, sponsor, score);

        matches.push({
          eventId: event.id,
          eventName: event.title,
          sponsorId: sponsor.id,
          sponsorName: sponsor.company_name,
          matchScore: score,
          matchReasons,
          sponsorshipTypes: sponsor.sponsorship_types || [],
          estimatedBudget: event.estimated_budget || 0,
          contactInfo: {
            name: sponsor.contact_name || 'Contact',
            email: sponsor.contact_email || '',
            phone: sponsor.contact_phone,
          },
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    logger.error('Error finding events for sponsor:', error);
    return [];
  }
}

/**
 * Generate match reasons
 */
function generateMatchReasons(event: any, sponsor: any, score: number): string[] {
  const reasons: string[] = [];

  // Category match
  if (sponsor.interested_categories?.includes(event.category)) {
    reasons.push('Event category matches your interests');
  }

  // Location match
  if (sponsor.interested_cities?.includes(event.city)) {
    reasons.push('Event is in your preferred location');
  } else if (sponsor.interested_cities?.includes('all')) {
    reasons.push('Event location is within your coverage area');
  }

  // Budget alignment
  if (sponsor.budget_range) {
    const eventBudget = event.estimated_budget || 0;
    if (eventBudget >= sponsor.budget_range.min && eventBudget <= sponsor.budget_range.max) {
      reasons.push('Event budget aligns with your investment range');
    }
  }

  // High attendee count
  if (event.max_attendees && event.max_attendees > 1000) {
    reasons.push(`Large audience expected (${event.max_attendees}+ attendees)`);
  }

  // Good overall match
  if (score >= 80) {
    reasons.push('Excellent overall match for your sponsorship goals');
  } else if (score >= 70) {
    reasons.push('Strong alignment with your criteria');
  }

  return reasons;
}

/**
 * Save match to database
 */
export async function saveSponsorMatch(
  eventId: string,
  sponsorId: string,
  matchScore: number,
  matchReasons: string[]
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.from('sponsor_matches').insert({
      event_id: eventId,
      sponsor_id: sponsorId,
      match_score: matchScore,
      match_reasons: matchReasons,
      status: 'pending',
    });

    if (error) {
      logger.error('Error saving match:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error saving sponsor match:', error);
    return false;
  }
}

/**
 * Get saved matches for event
 */
export async function getMatchesForEvent(eventId: string): Promise<SponsorMatch[]> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('sponsor_matches')
      .select(`
        *,
        sponsor:sponsor_profiles(*)
      `)
      .eq('event_id', eventId)
      .order('match_score', { ascending: false });

    if (error) {
      logger.error('Error getting matches:', error);
      return [];
    }

    return data.map((match: any) => ({
      eventId: match.event_id,
      eventName: '', // Would need to join with events table
      sponsorId: match.sponsor_id,
      sponsorName: match.sponsor?.company_name || '',
      matchScore: match.match_score,
      matchReasons: match.match_reasons || [],
      sponsorshipTypes: match.sponsor?.sponsorship_types || [],
      estimatedBudget: match.sponsor?.budget_range?.max || 0,
      contactInfo: {
        name: match.sponsor?.contact_name || '',
        email: match.sponsor?.contact_email || '',
        phone: match.sponsor?.contact_phone,
      },
    }));
  } catch (error) {
    logger.error('Error getting matches for event:', error);
    return [];
  }
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  matchId: string,
  status: 'contacted' | 'in_discussion' | 'confirmed' | 'declined' | 'not_interested'
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('sponsor_matches')
      .update({ status })
      .eq('id', matchId);

    if (error) {
      logger.error('Error updating match status:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error updating match status:', error);
    return false;
  }
}

/**
 * Get matchmaking statistics
 */
export async function getMatchmakingStats(eventId?: string) {
  try {
    const supabase = await createServerClient();

    let query = supabase.from('sponsor_matches').select('*');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: matches, error } = await query;

    if (error) {
      logger.error('Error getting stats:', error);
      return null;
    }

    const totalMatches = matches?.length || 0;
    const confirmedMatches = matches?.filter((m: any) => m.status === 'confirmed').length || 0;
    const inDiscussionMatches = matches?.filter((m: any) => m.status === 'in_discussion').length || 0;
    const avgMatchScore =
      totalMatches > 0
        ? (matches?.reduce((sum: number, m: any) => sum + m.match_score, 0) || 0) / totalMatches
        : 0;

    return {
      totalMatches,
      confirmedMatches,
      inDiscussionMatches,
      avgMatchScore: Math.round(avgMatchScore),
      conversionRate: totalMatches > 0 ? (confirmedMatches / totalMatches) * 100 : 0,
    };
  } catch (error) {
    logger.error('Error getting matchmaking stats:', error);
    return null;
  }
}

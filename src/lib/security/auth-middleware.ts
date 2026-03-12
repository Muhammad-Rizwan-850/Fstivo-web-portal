// =====================================================
// FSTIVO SECURITY - AUTHENTICATION MIDDLEWARE
// =====================================================
// Prevents authentication bypass and ensures proper auth
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

// =====================================================
// AUTHENTICATION GUARD
// =====================================================

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: NextResponse;
}

/**
 * Verify user is authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Verify configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error('Supabase configuration missing');
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Authentication service unavailable' },
          { status: 500 }
        ),
      };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      logger.error('Auth error:', authError);
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        ),
      };
    }

    if (!user) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    // Check if user is banned
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('id, is_banned')
      .eq('id', user.id)
      .single();

    if (profile?.is_banned) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Account suspended' },
          { status: 403 }
        ),
      };
    }

    return { success: true, user };
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      ),
    };
  }
}

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

export interface AdminAuthResult {
  success: boolean;
  user?: any;
  role?: string;
  error?: NextResponse;
}

/**
 * Verify user is authenticated and is admin
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  // First, verify authentication
  const authResult = await requireAuth(request);

  if (!authResult.success) {
    return authResult as AdminAuthResult;
  }

  const user = authResult.user!;

  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: adminData, error: adminError } = await (supabase
      .from('admin_users') as any)
      .select('role, permissions')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData) {
      return {
        success: false,
        user,
        error: NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user,
      role: adminData.role,
    };
  } catch (error) {
    logger.error('Admin auth error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      ),
    };
  }
}

// =====================================================
// EVENT ORGANIZER AUTHENTICATION
// =====================================================

/**
 * Verify user is the organizer of an event
 */
export async function requireEventOrganizer(
  request: NextRequest,
  eventId: string
): Promise<AuthResult> {
  // First, verify authentication
  const authResult = await requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  const user = authResult.user!;

  try {
    const supabase = await createClient();

    // Check if user is the organizer
    const { data: eventData, error: eventError } = await (supabase
      .from('events') as any)
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        ),
      };
    }

    if (eventData.organizer_id !== user.id) {
      // Check if user is admin (admins can access all events)
      const adminResult = await requireAdmin(request);
      if (!adminResult.success) {
        return {
          success: false,
          error: NextResponse.json(
            { error: 'Access denied. You are not the organizer of this event.' },
            { status: 403 }
          ),
        };
      }
    }

    return { success: true, user };
  } catch (error) {
    logger.error('Event organizer auth error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      ),
    };
  }
}

// =====================================================
// TICKET OWNER AUTHENTICATION
// =====================================================

/**
 * Verify user owns a ticket
 */
export async function requireTicketOwner(
  request: NextRequest,
  ticketId: string
): Promise<AuthResult> {
  const authResult = await requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  const user = authResult.user!;

  try {
    const supabase = await createClient();

    const { data: ticket, error } = await (supabase
      .from('tickets') as any)
      .select('user_id, event_id')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        ),
      };
    }

    if (ticket.user_id !== user.id) {
      // Check if user is admin or event organizer
      const adminResult = await requireAdmin(request);
      if (!adminResult.success) {
        const organizerResult = await requireEventOrganizer(request, ticket.event_id);
        if (!organizerResult.success) {
          return {
            success: false,
            error: NextResponse.json(
              { error: 'Access denied. You do not own this ticket.' },
              { status: 403 }
            ),
          };
        }
      }
    }

    return { success: true, user };
  } catch (error) {
    logger.error('Ticket owner auth error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      ),
    };
  }
}

// =====================================================
// HIGHER ORDER FUNCTIONS
// =====================================================

/**
 * Wrap API route with authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAuth(request);

    if (!authResult.success) {
      return authResult.error!;
    }

    return handler(request, authResult.user);
  };
}

/**
 * Wrap API route with admin authentication
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: any, role: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      return authResult.error!;
    }

    return handler(request, authResult.user, authResult.role!);
  };
}

/**
 * Wrap API route with event organizer authentication
 */
export function withEventOrganizerAuth(
  handler: (request: NextRequest, user: any, eventId: string) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    { params }: { params: { eventId: string } }
  ): Promise<NextResponse> => {
    const authResult = await requireEventOrganizer(request, params.eventId);

    if (!authResult.success) {
      return authResult.error!;
    }

    return handler(request, authResult.user, params.eventId);
  };
}

// =====================================================
// SESSION VALIDATION
// =====================================================

/**
 * Validate user session
 */
export async function validateSession(request: NextRequest): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    return !!session;
  } catch {
    return false;
  }
}

/**
 * Refresh session if needed
 */
export async function refreshSessionIfNeeded(request: NextRequest): Promise<void> {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Check if session needs refresh
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);

      if (expiresAt && expiresAt - now < 300) {
        // Refresh if less than 5 minutes remaining
        await supabase.auth.refreshSession();
      }
    }
  } catch (error) {
    logger.error('Session refresh error:', error);
  }
}

// =====================================================
// PERMISSION CHECKS
// =====================================================

/**
 * Check if user has specific permission
 */
export async function hasPermission(user: any, permission: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: adminData } = await (supabase
      .from('admin_users') as any)
      .select('permissions')
      .eq('user_id', user.id)
      .single();

    if (!adminData?.permissions) {
      return false;
    }

    const permissions = Array.isArray(adminData.permissions)
      ? adminData.permissions
      : JSON.parse(adminData.permissions);

    return permissions.includes(permission);
  } catch {
    return false;
  }
}

/**
 * Require specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<AuthResult> {
  const authResult = await requireAdmin(request);

  if (!authResult.success) {
    return authResult;
  }

  const user = authResult.user!;

  const hasPerm = await hasPermission(user, permission);

  if (!hasPerm) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Permission required: ${permission}` },
        { status: 403 }
      ),
    };
  }

  return { success: true, user };
}

// =====================================================
// EXPORTS
// =====================================================

// Types are already exported at their declarations

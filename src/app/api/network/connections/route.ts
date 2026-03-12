import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/network/connections
 * Get connections and suggestions
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') || 'suggestions' // 'suggestions', 'connections', 'pending'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (type === 'suggestions') {
      // Get suggested connections
      const { data: suggestions } = await (supabase as any).rpc('get_suggested_connections', {
        current_user_id: user.id,
        limit_count: limit
      })

      return NextResponse.json({ suggestions: suggestions || [] })
    } else if (type === 'connections') {
      // Get accepted connections
      const { data: connections } = await supabase
        .from('user_connections')
        .select(`
          *,
          requester:user_networking_profiles!user_connections_requester_id_fkey(
            user_id,
            display_name,
            avatar_url,
            university,
            major,
            location,
            interests
          ),
          accepter:user_networking_profiles!user_connections_accepter_id_fkey(
            user_id,
            display_name,
            avatar_url,
            university,
            major,
            location,
            interests
          )
        `)
        .or(`requester_id.eq.${user.id},accepter_id.eq.${user.id}`)
        .eq('status', 'accepted')

      // Format connections to return the connected user's data
      const formattedConnections = connections?.map((conn: any) => {
        const isRequester = conn.requester_id === user.id
        const connectedUser = isRequester ? conn.accepter : conn.requester
        return {
          id: conn.id,
          connection_id: conn.id,
          user_id: connectedUser.user_id,
          display_name: connectedUser.display_name,
          avatar_url: connectedUser.avatar_url,
          university: connectedUser.university,
          major: connectedUser.major,
          location: connectedUser.location,
          interests: connectedUser.interests,
          connection_strength: conn.connection_strength,
          mutual_connections: conn.mutual_connections,
          connected_at: conn.created_at
        }
      }) || []

      return NextResponse.json({ connections: formattedConnections })
    } else if (type === 'pending') {
      // Get pending connection requests
      const { data: pending } = await supabase
        .from('connection_requests')
        .select(`
          *,
          requester:user_networking_profiles!connection_requests_requester_id_fkey(
            user_id,
            display_name,
            avatar_url,
            university,
            major,
            bio
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')

      return NextResponse.json({ pending: pending || [] })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    logger.error('Error fetching connections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/network/connections
 * Send connection request or accept/reject
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, requestId, message } = body

    if (action === 'send') {
      // Send connection request
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }

      // Check if connection already exists
      const { data: existing } = await supabase
        .from('user_connections')
        .or(`requester_id.eq.${user.id},accepter_id.eq.${userId}`)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Connection already exists' }, { status: 400 })
      }

      // Create connection request
      const { data: connection, error } = await supabase
        .from('connection_requests')
        .insert({
          requester_id: user.id,
          receiver_id: userId,
          message: message || 'I would like to connect with you!'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Create notification
      await (supabase as any).from('social_notifications').insert({
        user_id: userId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${message || 'Someone wants to connect with you!'}`,
        data: { request_id: connection.id }
      })

      return NextResponse.json({ connection, message: 'Connection request sent' }, { status: 201 })
    } else if (action === 'accept' || action === 'reject') {
      // Accept or reject connection request
      if (!requestId) {
        return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
      }

      const { data: request } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (!request || request.receiver_id !== user.id) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }

      // Update request status
      const { data: updatedRequest } = await supabase
        .from('connection_requests')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', requestId)
        .select()
        .single()

      if (action === 'accept') {
        // Create mutual connection
        await (supabase as any).from('user_connections').insert({
          requester_id: request.requester_id,
          accepter_id: request.receiver_id,
          status: 'accepted'
        })

        // Create notification to requester
        await (supabase as any).from('social_notifications').insert({
          user_id: request.requester_id,
          type: 'connection_accepted',
          title: 'Connection Accepted!',
          message: 'Your connection request was accepted',
          link: `/network/connections/${user.id}`,
          data: { connection_id: requestId }
        })
      }

      return NextResponse.json({
        message: action === 'accept' ? 'Connection accepted' : 'Connection rejected'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    logger.error('Error processing connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

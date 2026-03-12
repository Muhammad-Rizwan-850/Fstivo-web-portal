import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/network/messages
 * Fetch conversations or specific conversation messages
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const conversationId = searchParams.get('conversationId')

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (conversationId) {
      // Get messages for a specific conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('sender_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      return NextResponse.json({ messages: messages || [] })
    } else {
      // Get all conversations for the current user
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1:user_networking_profiles!conversations_participant_1_id_fkey(
            user_id,
            display_name,
            avatar_url,
            university
          ),
          participant_2:user_networking_profiles!conversations_participant_2_id_fkey(
            user_id,
            display_name,
            avatar_url,
            university
          )
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      // Format conversations to show the other user's data
      const formattedConversations = conversations?.map((conv: any) => {
        const isParticipant1 = conv.participant_1_id === user.id
        const otherUser = isParticipant1 ? conv.participant_2 : conv.participant_1
        const unreadCount = isParticipant1 ? conv.unread_count_p1 : conv.unread_count_p2

        return {
          id: conv.id,
          user_id: otherUser.user_id,
          display_name: otherUser.display_name,
          avatar_url: otherUser.avatar_url,
          university: otherUser.university,
          last_message_at: conv.last_message_at,
          last_message_preview: conv.last_message_preview,
          messages_count: conv.messages_count,
          unread_count: unreadCount
        }
      }) || []

      return NextResponse.json({ conversations: formattedConversations })
    }
  } catch (error) {
    logger.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/network/messages
 * Send a new message
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
    const { receiverId, content } = body

    // Validate required fields
    if (!receiverId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    // Check if conversation exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${receiverId}),and(participant_1_id.eq.${receiverId},participant_2_id.eq.${user.id})`)
      .single()

    let conversationId = existingConversation?.id

    // Create conversation if it doesn't exist
    if (!conversationId) {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user.id,
          participant_2_id: receiverId
        })
        .select()
        .single()

      conversationId = newConversation?.id
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim()
      })
      .select()
      .single()

    if (messageError) {
      logger.error('Error creating message:', messageError)
      return NextResponse.json({ error: messageError.message }, { status: 500 })
    }

    // Update conversation
    const isParticipant1 = existingConversation?.participant_1_id === user.id
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.trim().substring(0, 100),
        messages_count: (existingConversation?.messages_count || 0) + 1,
        unread_count_p1: isParticipant1 ? existingConversation?.unread_count_p1 || 0 : (existingConversation?.unread_count_p1 || 0) + 1,
        unread_count_p2: !isParticipant1 ? existingConversation?.unread_count_p2 || 0 : (existingConversation?.unread_count_p2 || 0) + 1
      })
      .eq('id', conversationId)

    // Create notification
    await (supabase as any).from('social_notifications').insert({
      user_id: receiverId,
      type: 'message',
      title: 'New Message',
      message: `${content.trim().substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      link: `/network/messages/${conversationId}`,
      data: { conversation_id: conversationId, message_id: message.id }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    logger.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/network/messages
 * Mark messages as read
 */
export async function PUT(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, senderId } = body

    if (!conversationId || !senderId) {
      return NextResponse.json(
        { error: 'Conversation ID and sender ID are required' },
        { status: 400 }
      )
    }

    // Mark messages as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update conversation unread count
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (conversation) {
      const isParticipant1 = conversation.participant_1_id === user.id
      await supabase
        .from('conversations')
        .update({
          unread_count_p1: isParticipant1 ? 0 : conversation.unread_count_p1,
          unread_count_p2: !isParticipant1 ? 0 : conversation.unread_count_p2
        })
        .eq('id', conversationId)
    }

    return NextResponse.json({ message: 'Messages marked as read' })
  } catch (error) {
    logger.error('Error marking messages as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

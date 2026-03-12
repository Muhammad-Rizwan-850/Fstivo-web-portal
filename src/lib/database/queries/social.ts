import { createClient } from '@/lib/auth/config'

// Types for social features
export interface EventPost {
  id: string
  event_id: string
  user_id: string
  content: string
  post_type: 'text' | 'photo' | 'poll'
  media_url?: string
  visibility: 'public' | 'attendees' | 'connections'
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  reaction_type: 'like' | 'love' | 'celebrate' | 'insightful' | 'funny'
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  parent_comment_id?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  replies?: PostComment[]
}

export interface EventPhoto {
  id: string
  event_id: string
  user_id: string
  photo_url: string
  caption?: string
  moderation_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export interface Referral {
  id: string
  referrer_id: string
  referral_code: string
  total_referrals: number
  successful_referrals: number
  total_earned: number
  created_at: string
}

export interface Connection {
  id: string
  user_id: string
  connected_user_id: string
  connection_type: 'friend' | 'follower' | 'blocked'
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

// Posts
export async function getEventPosts(
  eventId: string,
  userId?: string
): Promise<EventPost[]> {
  const supabase = await createClient()

  let query = supabase
    .from('event_posts')
    .select(`
      *,
      user:user_id(id, full_name, avatar_url)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  // Filter by visibility if user is provided
  if (userId) {
    query = query.or(`visibility.eq.public,and(visibility.eq.attendees,user_id.eq.${userId})`)
  } else {
    query = query.eq('visibility', 'public')
  }

  const { data } = await query
  return (data as EventPost[]) || []
}

export async function createPost(data: {
  event_id: string
  user_id: string
  content: string
  post_type?: 'text' | 'photo' | 'poll'
  media_url?: string
  visibility?: 'public' | 'attendees' | 'connections'
}): Promise<EventPost | null> {
  const supabase = await createClient()

  const { data: post } = await (supabase
    .from('event_posts') as any)
    .insert({
      event_id: data.event_id,
      user_id: data.user_id,
      content: data.content,
      post_type: data.post_type || 'text',
      media_url: data.media_url,
      visibility: data.visibility || 'public',
      likes_count: 0,
      comments_count: 0,
    })
    .select()
    .single()

  return post as EventPost | null
}

export async function deletePost(postId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('event_posts') as any)
    .delete()
    .eq('id', postId)

  return !error
}

// Reactions
export async function reactToPost(data: {
  post_id: string
  user_id: string
  reaction_type: 'like' | 'love' | 'celebrate' | 'insightful' | 'funny'
}): Promise<PostReaction | null> {
  const supabase = await createClient()

  // Check if reaction already exists
  const { data: existing } = await (supabase
    .from('post_reactions') as any)
    .select('*')
    .eq('post_id', data.post_id)
    .eq('user_id', data.user_id)
    .single()

  if (existing) {
    // Update existing reaction
    const { data: updated } = await (supabase
      .from('post_reactions') as any)
      .update({ reaction_type: data.reaction_type })
      .eq('id', existing.id)
      .select()
      .single()

    return updated as PostReaction | null
  }

  // Create new reaction
  const { data: reaction } = await (supabase
    .from('post_reactions') as any)
    .insert(data)
    .select()
    .single()

  // Update likes count
  if (reaction) {
    await supabase.rpc('increment_post_likes', { post_id: data.post_id } as any)
  }

  return reaction as PostReaction | null
}

export async function removeReaction(postId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('post_reactions') as any)
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (!error) {
    await supabase.rpc('decrement_post_likes', { post_id: postId } as any)
  }

  return !error
}

export async function getPostReactions(postId: string): Promise<PostReaction[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)

  return (data as PostReaction[]) || []
}

export async function getUserReaction(
  postId: string,
  userId: string
): Promise<PostReaction | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single()

  return data as PostReaction | null
}

// Comments
export async function getPostComments(postId: string): Promise<PostComment[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('post_comments')
    .select(`
      *,
      user:user_id(id, full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true })

  if (!data) return []

  // Fetch replies for each comment
  const commentsWithReplies = await Promise.all(
    (data as PostComment[]).map(async (comment) => {
      const { data: replies } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:user_id(id, full_name, avatar_url)
        `)
        .eq('parent_comment_id', comment.id)
        .order('created_at', { ascending: true })

      return {
        ...comment,
        replies: replies || [],
      }
    })
  )

  return commentsWithReplies
}

export async function addComment(data: {
  post_id: string
  user_id: string
  content: string
  parent_comment_id?: string
}): Promise<PostComment | null> {
  const supabase = await createClient()

  const { data: comment } = await (supabase
    .from('post_comments') as any)
    .insert(data)
    .select()
    .single()

  // Update comments count if it's a top-level comment
  if (comment && !data.parent_comment_id) {
    await supabase.rpc('increment_post_comments', { post_id: data.post_id } as any)
  }

  return comment as PostComment | null
}

export async function deleteComment(commentId: string, postId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('post_comments') as any)
    .delete()
    .eq('id', commentId)

  if (!error) {
    await supabase.rpc('decrement_post_comments', { post_id: postId } as any)
  }

  return !error
}

// Photos
export async function getEventPhotos(
  eventId: string,
  status: 'pending' | 'approved' | 'rejected' = 'approved'
): Promise<EventPhoto[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('event_photos')
    .select(`
      *,
      user:user_id(id, full_name, avatar_url)
    `)
    .eq('event_id', eventId)
    .eq('moderation_status', status)
    .order('created_at', { ascending: false })

  return (data as EventPhoto[]) || []
}

export async function uploadPhoto(data: {
  event_id: string
  user_id: string
  photo_url: string
  caption?: string
}): Promise<EventPhoto | null> {
  const supabase = await createClient()

  const { data: photo } = await (supabase
    .from('event_photos') as any)
    .insert({
      event_id: data.event_id,
      user_id: data.user_id,
      photo_url: data.photo_url,
      caption: data.caption,
      moderation_status: 'pending',
    })
    .select()
    .single()

  return photo as EventPhoto | null
}

export async function moderatePhoto(
  photoId: string,
  status: 'approved' | 'rejected'
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('event_photos') as any)
    .update({ moderation_status: status })
    .eq('id', photoId)

  return !error
}

// Referrals
export async function getReferralByCode(code: string): Promise<Referral | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', code)
    .single()

  return data as Referral | null
}

export async function getUserReferral(userId: string): Promise<Referral | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .single()

  return data as Referral | null
}

export async function createReferral(userId: string): Promise<Referral | null> {
  const supabase = await createClient()

  // Generate unique referral code
  const code = `FST${userId.slice(0, 8).toUpperCase()}`

  const { data: referral } = await (supabase
    .from('referrals') as any)
    .insert({
      referrer_id: userId,
      referral_code: code,
      total_referrals: 0,
      successful_referrals: 0,
      total_earned: 0,
    })
    .select()
    .single()

  return referral as Referral | null
}

export async function recordReferralUsage(referralCode: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('record_referral', {
    referral_code: referralCode,
  } as any)

  return !error
}

// Connections
export async function getUserConnections(
  userId: string,
  status: 'pending' | 'accepted' = 'accepted'
): Promise<Connection[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('connections')
    .select(`
      *,
      connected_profile:connected_user_id(id, full_name, avatar_url)
    `)
    .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
    .eq('status', status)
    .order('created_at', { ascending: false })

  return (data as Connection[]) || []
}

export async function sendConnectionRequest(data: {
  user_id: string
  connected_user_id: string
  connection_type?: 'friend' | 'follower'
}): Promise<Connection | null> {
  const supabase = await createClient()

  const { data: connection } = await (supabase
    .from('connections') as any)
    .insert({
      user_id: data.user_id,
      connected_user_id: data.connected_user_id,
      connection_type: data.connection_type || 'friend',
      status: 'pending',
    })
    .select()
    .single()

  return connection as Connection | null
}

export async function updateConnectionStatus(
  connectionId: string,
  status: 'accepted' | 'rejected'
): Promise<Connection | null> {
  const supabase = await createClient()

  const { data: connection } = await (supabase
    .from('connections') as any)
    .update({ status })
    .eq('id', connectionId)
    .select()
    .single()

  return connection as Connection | null
}

export async function removeConnection(connectionId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('connections') as any)
    .delete()
    .eq('id', connectionId)

  return !error
}

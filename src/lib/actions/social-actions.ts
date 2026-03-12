'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import * as socialQueries from '@/lib/database/queries/social'

/**
 * Create a new post for an event
 */
export async function createEventPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to post' }
  }

  const eventId = formData.get('event_id') as string
  const content = formData.get('content') as string
  const postType = formData.get('post_type') as 'text' | 'photo' | 'poll' || 'text'
  const mediaUrl = formData.get('media_url') as string
  const visibility = formData.get('visibility') as 'public' | 'attendees' | 'connections' || 'public'

  if (!eventId || !content) {
    return { error: 'Event ID and content are required' }
  }

  const post = await socialQueries.createPost({
    event_id: eventId,
    user_id: user.id,
    content,
    post_type: postType,
    media_url: mediaUrl || undefined,
    visibility,
  })

  if (!post) {
    return { error: 'Failed to create post' }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true, post }
}

/**
 * Delete a post
 */
export async function deleteEventPost(postId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await socialQueries.deletePost(postId)

  if (!success) {
    return { error: 'Failed to delete post' }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true }
}

/**
 * React to a post
 */
export async function reactToPost(postId: string, reactionType: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to react' }
  }

  const validReactions = ['like', 'love', 'celebrate', 'insightful', 'funny']
  if (!validReactions.includes(reactionType)) {
    return { error: 'Invalid reaction type' }
  }

  const reaction = await socialQueries.reactToPost({
    post_id: postId,
    user_id: user.id,
    reaction_type: reactionType as any,
  })

  if (!reaction) {
    return { error: 'Failed to react to post' }
  }

  revalidatePath(`/events/[eventId]`)
  return { success: true, reaction }
}

/**
 * Remove reaction from post
 */
export async function removeReaction(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await socialQueries.removeReaction(postId, user.id)

  if (!success) {
    return { error: 'Failed to remove reaction' }
  }

  revalidatePath(`/events/[eventId]`)
  return { success: true }
}

/**
 * Add comment to post
 */
export async function addComment(postId: string, content: string, parentCommentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to comment' }
  }

  if (!content.trim()) {
    return { error: 'Comment cannot be empty' }
  }

  const comment = await socialQueries.addComment({
    post_id: postId,
    user_id: user.id,
    content,
    parent_comment_id: parentCommentId,
  })

  if (!comment) {
    return { error: 'Failed to add comment' }
  }

  revalidatePath(`/events/[eventId]`)
  return { success: true, comment }
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await socialQueries.deleteComment(commentId, postId)

  if (!success) {
    return { error: 'Failed to delete comment' }
  }

  revalidatePath(`/events/[eventId]`)
  return { success: true }
}

/**
 * Upload event photo
 */
export async function uploadEventPhoto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to upload photos' }
  }

  const eventId = formData.get('event_id') as string
  const photoUrl = formData.get('photo_url') as string
  const caption = formData.get('caption') as string

  if (!eventId || !photoUrl) {
    return { error: 'Event ID and photo URL are required' }
  }

  const photo = await socialQueries.uploadPhoto({
    event_id: eventId,
    user_id: user.id,
    photo_url: photoUrl,
    caption: caption || undefined,
  })

  if (!photo) {
    return { error: 'Failed to upload photo' }
  }

  revalidatePath(`/events/${eventId}`)
  return { success: true, photo }
}

/**
 * Moderate event photo (admin only)
 */
export async function moderatePhoto(photoId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user is admin
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || ((profile as any).role !== 'admin' && (profile as any).role !== 'organizer')) {
    return { error: 'You do not have permission to moderate photos' }
  }

  const success = await socialQueries.moderatePhoto(photoId, status)

  if (!success) {
    return { error: 'Failed to moderate photo' }
  }

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Get user referral code
 */
export async function getUserReferral() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  let referral = await socialQueries.getUserReferral(user.id)

  if (!referral) {
    referral = await socialQueries.createReferral(user.id)
  }

  if (!referral) {
    return { error: 'Failed to get referral code' }
  }

  return { success: true, referral }
}

/**
 * Record referral usage
 */
export async function useReferralCode(referralCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await socialQueries.recordReferralUsage(referralCode)

  if (!success) {
    return { error: 'Invalid or expired referral code' }
  }

  return { success: true, message: 'Referral code applied successfully!' }
}

/**
 * Send connection request
 */
export async function sendConnectionRequest(connectedUserId: string, connectionType: 'friend' | 'follower' = 'friend') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  if (user.id === connectedUserId) {
    return { error: 'You cannot connect with yourself' }
  }

  const connection = await socialQueries.sendConnectionRequest({
    user_id: user.id,
    connected_user_id: connectedUserId,
    connection_type: connectionType,
  })

  if (!connection) {
    return { error: 'Failed to send connection request' }
  }

  revalidatePath(`/profile/${connectedUserId}`)
  return { success: true, connection }
}

/**
 * Update connection status
 */
export async function updateConnectionStatus(connectionId: string, status: 'accepted' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const connection = await socialQueries.updateConnectionStatus(connectionId, status)

  if (!connection) {
    return { error: 'Failed to update connection status' }
  }

  revalidatePath('/profile/connections')
  return { success: true, connection }
}

/**
 * Remove connection
 */
export async function removeConnection(connectionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const success = await socialQueries.removeConnection(connectionId)

  if (!success) {
    return { error: 'Failed to remove connection' }
  }

  revalidatePath('/profile/connections')
  return { success: true }
}

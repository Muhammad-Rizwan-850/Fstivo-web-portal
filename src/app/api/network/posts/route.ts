import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/network/posts
 * Fetch social feed
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('userId') // Optional: get specific user's posts

    // Build query
    let query = supabase
      .from('social_posts')
      .select(`
        *,
        user:user_networking_profiles(user_id, display_name, avatar_url, university),
        event:events(id, title, date, location),
        likes:post_likes(count),
        comments:post_comments(count)
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('is_public', true)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      posts: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    })
  } catch (error) {
    logger.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/network/posts
 * Create a new social post
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
    const { content, eventId, images, tags, isPublic = true } = body

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      )
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        event_id: eventId,
        images: images || [],
        tags: tags || [],
        is_public: isPublic
      })
      .select()
      .single()

    if (postError) {
      logger.error('Error creating post:', postError)
      return NextResponse.json({ error: postError.message }, { status: 500 })
    }

    // Notify tagged users
    if (tags && tags.length > 0) {
      const notifications = tags.map((taggedUserId: string) => ({
        user_id: taggedUserId,
        type: 'post_tag',
        title: 'You were mentioned in a post',
        message: `You were tagged in a post`,
        link: `/network/feed/${post.id}`,
        data: { post_id: post.id }
      }))

      await (supabase as any).from('social_notifications').insert(notifications)
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    logger.error('Error creating post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/network/posts
 * Delete a post
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Check if user owns the post
    const { data: post } = await supabase
      .from('social_posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (!post || post.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete post (likes, comments, shares will cascade)
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', postId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    logger.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

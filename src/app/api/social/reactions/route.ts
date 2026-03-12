import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { PostReaction } from '@/types/api'
import { logger } from '@/lib/logger';

// POST: Add/update reaction to post
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { post_id, reaction_type } = await request.json()

    if (!post_id || !reaction_type) {
      return NextResponse.json({ error: 'post_id and reaction_type are required' }, { status: 400 })
    }

    // Check if already reacted
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Update existing reaction
      const { data, error } = await supabase
        .from('post_reactions')
        .update({ reaction_type })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ reaction: data })
    }

    // Create new reaction
    const { data, error } = await supabase
      .from('post_reactions')
      .insert({
        post_id,
        user_id: user.id,
        reaction_type
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ reaction: data })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    logger.error('Error adding reaction:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE: Remove reaction
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error removing reaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

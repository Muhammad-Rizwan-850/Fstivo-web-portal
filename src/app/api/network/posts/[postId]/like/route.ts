import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/network/posts/[postId]/like
 *
 * Toggle like status on a post
 * If already liked, unlike the post
 * If not liked, like the post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to continue' },
        { status: 401 }
      );
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, likes_count')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike: Remove the like
      await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      // Decrement like count
      const newCount = Math.max(0, (post.likes_count || 0) - 1);
      await supabase
        .from('posts')
        .update({ likes_count: newCount })
        .eq('id', postId);

      return NextResponse.json({ 
        liked: false, 
        action: 'unliked',
        likesCount: newCount
      });
    } else {
      // Like: Add the like
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      // Increment like count
      const newCount = (post.likes_count || 0) + 1;
      await supabase
        .from('posts')
        .update({ likes_count: newCount })
        .eq('id', postId);

      return NextResponse.json({ 
        liked: true, 
        action: 'liked',
        likesCount: newCount
      });
    }
  } catch (error: any) {
    logger.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Failed to like post', details: error.message },
      { status: 500 }
    );
  }
}

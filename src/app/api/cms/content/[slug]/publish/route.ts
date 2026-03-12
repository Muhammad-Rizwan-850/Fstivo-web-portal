import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cms } from '@/lib/cms';
import { logger } from '@/lib/logger';

/**
 * POST /api/cms/content/[slug]/publish
 * Publish CMS content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createClient();
    const { slug } = await params;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current content to check ownership
    const currentContent = await cms.getContentById(slug);
    if (!currentContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if user owns the content or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (currentContent.author_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const success = await cms.publishContent(currentContent.id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 });
    }

    // Get updated content
    const updatedContent = await cms.getContentById(currentContent.id);

    return NextResponse.json({ content: updatedContent });
  } catch (error) {
    logger.error('Error in POST /api/cms/content/[slug]/publish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
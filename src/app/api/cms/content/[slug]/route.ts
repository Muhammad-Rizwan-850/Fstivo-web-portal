import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cms } from '@/lib/cms';
import { logger } from '@/lib/logger';

/**
 * GET /api/cms/content/[slug]
 * Get CMS content by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const content = await cms.getContent(slug);
    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    logger.error('Error in GET /api/cms/content/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/cms/content/[slug]
 * Update CMS content
 */
export async function PUT(
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

    const body = await request.json();
    const updates = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      status: body.status,
      metadata: body.metadata,
      tags: body.tags,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      featured_image: body.featured_image,
    };

    const updatedContent = await cms.updateContent(currentContent.id, updates, user.id);
    if (!updatedContent) {
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }

    return NextResponse.json({ content: updatedContent });
  } catch (error) {
    logger.error('Error in PUT /api/cms/content/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/cms/content/[slug]
 * Delete CMS content
 */
export async function DELETE(
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

    const success = await cms.deleteContent(currentContent.id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/cms/content/[slug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
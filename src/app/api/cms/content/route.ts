import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cms } from '@/lib/cms';
import { CMSContent } from '@/lib/cms';
import { logger } from '@/lib/logger';

/**
 * GET /api/cms/content
 * List CMS content with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const filters = {
      content_type: searchParams.get('content_type') || undefined,
      status: searchParams.get('status') || undefined,
      author_id: searchParams.get('author_id') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const content = await cms.listContent(filters);

    return NextResponse.json({ content });
  } catch (error) {
    logger.error('Error in GET /api/cms/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/cms/content
 * Create new CMS content
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug,
      title,
      content: contentText,
      excerpt,
      content_type,
      metadata,
      tags,
      seo_title,
      seo_description,
      featured_image,
    } = body;

    // Validate required fields
    if (!slug || !title || !contentText || !content_type) {
      return NextResponse.json({
        error: 'Missing required fields: slug, title, content, content_type'
      }, { status: 400 });
    }

    // Check if slug is unique
    const existingContent = await cms.getContent(slug);
    if (existingContent) {
      return NextResponse.json({
        error: 'Slug already exists'
      }, { status: 400 });
    }

    const contentData = {
      slug,
      title,
      content: contentText,
      excerpt,
      status: 'draft' as const,
      content_type,
      author_id: user.id,
      metadata: metadata || {},
      tags: tags || [],
      seo_title,
      seo_description,
      featured_image,
    };

    const newContent = await cms.createContent(contentData);
    if (!newContent) {
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
    }

    return NextResponse.json({ content: newContent }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/cms/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
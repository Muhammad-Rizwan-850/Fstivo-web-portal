import { NextRequest, NextResponse } from 'next/server';
import { cms } from '@/lib/cms';
import { logger } from '@/lib/logger';

/**
 * GET /api/cms/search
 * Search CMS content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const content_type = searchParams.get('content_type') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    if (!query) {
      return NextResponse.json({
        error: 'Search query is required'
      }, { status: 400 });
    }

    const results = await cms.searchContent(query, { content_type, limit });

    return NextResponse.json({ results });
  } catch (error) {
    logger.error('Error in GET /api/cms/search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
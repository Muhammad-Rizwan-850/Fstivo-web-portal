import { getApiDocs } from '@/lib/swagger';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const GET = () => {
  try {
    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (error) {
    logger.error('Error generating API docs:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
};
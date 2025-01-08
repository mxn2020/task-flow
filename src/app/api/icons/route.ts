// app/api/icons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import * as LucideIcons from 'lucide-react';
import { IconName } from '@/types/icons';
import { cache } from 'react';
import { ALL_ICON_NAMES } from '@/lib/icons';
import { AppError } from '@/lib/errors/types';

const iconCache = new Map<string, IconName[]>();

const searchIcons = cache((searchStr: string): IconName[] => {
  try {
    const cacheKey = searchStr.toLowerCase().trim();
    if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

    const filtered = searchStr ? 
      ALL_ICON_NAMES.filter(iconName => iconName.toLowerCase().includes(cacheKey)) : 
      ALL_ICON_NAMES;

    iconCache.set(cacheKey, filtered);
    return filtered;
  } catch (error) {
    console.error('Icon search error:', error);
    throw new AppError('Failed to search icons', 500, 'ICON_SEARCH_ERROR');
  }
});

export const GET = withAuth(async (req: NextRequest, context: any, session: any) => {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (isNaN(page) || page < 0) {
    throw new AppError('Invalid page parameter', 400, 'INVALID_PAGE');
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new AppError('Invalid limit parameter', 400, 'INVALID_LIMIT');
  }

  const filtered = searchIcons(search);
  const total = filtered.length;
  const startIndex = page * limit;
  const endIndex = Math.min(startIndex + limit, total);

  if (startIndex >= total) {
    throw new AppError('Page out of range', 400, 'PAGE_OUT_OF_RANGE');
  }

  const hasNextPage = endIndex < total;
  const icons = filtered.slice(startIndex, endIndex);

  return NextResponse.json({ 
    icons,
    total,
    hasNextPage,
    nextPage: hasNextPage ? page + 1 : null,
    pageInfo: {
      current: page,
      size: limit,
      total: Math.ceil(total / limit)
    }
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
});
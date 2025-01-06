// app/api/icons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as LucideIcons from 'lucide-react';
import { IconName } from '@/types/icons';
import { cache } from 'react';
import { ALL_ICON_NAMES } from '@/lib/icons';

const iconCache = new Map<string, IconName[]>();

const searchIcons = cache((searchStr: string): IconName[] => {
  const cacheKey = searchStr.toLowerCase().trim();
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

  const filtered = searchStr ? 
    ALL_ICON_NAMES.filter(iconName => iconName.toLowerCase().includes(cacheKey)) : 
    ALL_ICON_NAMES;

  iconCache.set(cacheKey, filtered);
  return filtered;
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const filtered = searchIcons(search);
  const total = filtered.length;
  const startIndex = page * limit;
  const endIndex = Math.min(startIndex + limit, total);
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
}


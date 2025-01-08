// middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    try {
      // API routes handling
      if (req.nextUrl.pathname.startsWith('/api/v1/')) {
        const apiKey = req.headers.get('x-api-key');
        
        if (!apiKey) {
          return NextResponse.json({ error: 'API key required' }, { status: 401 });
        }

        const verifyResponse = await fetch(`${req.nextUrl.origin}/api/keys/verify`, {
          method: 'POST',
          headers: { 'x-api-key': apiKey }
        });

        if (!verifyResponse.ok) {
          const error = await verifyResponse.json();
          return NextResponse.json({ error: error.error }, { status: verifyResponse.status });
        }

        const { permissions } = await verifyResponse.json();
        const requiresWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
        
        if (requiresWrite && !permissions.write) {
          return NextResponse.json({ error: 'Write permission required' }, { status: 403 });
        }

        return NextResponse.next();
      }

      // Regular auth handling
      const token = req.nextauth?.token;
      
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }

      if (req.nextUrl.pathname.startsWith('/admin') && token.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/auth/error', req.url));
    }
  },
  {
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error'
    },
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings',
    '/profile',
    '/organization',
    '/api/protected/:path*',
    '/admin/:path*',
    '/api/v1/:path*'
  ],
};
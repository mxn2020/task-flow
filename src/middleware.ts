// middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    try {
      const token = req.nextauth?.token;
      
      // Check authentication
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }

      // Role-based access for admin routes
      if (req.nextUrl.pathname.startsWith('/admin') && token.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Auth middleware error:', error);
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
  ],
};
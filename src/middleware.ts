// middleware.ts

import { withAuth } from 'next-auth/middleware';

export default withAuth({
    pages: {
        signIn: '/auth/signin'
    }
});

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/settings',
        '/todos',
        '/brainstorms',
        '/notes',
        '/templates',
        '/profile',
        '/groups',
        '/organization',
        '/api/protected/:path*',
        '/admin/:path*',
        '/scopes/:scopeSlug*'
    ],
};

// lib/auth.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from './supabaseClient';
import { compare } from 'bcryptjs';
import { AppError } from './errors/types';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials.password) {
            throw new AppError('Please enter both email and password', 400, 'INVALID_CREDENTIALS');
          }

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error) {
            console.error('Supabase error:', error);
            throw new AppError('Database error occurred', 500, 'DATABASE_ERROR');
          }

          if (!profile) {
            throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
          }

          const isValid = await compare(credentials.password, profile.password_hash);
          if (!isValid) {
            throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
          }

          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw error instanceof AppError ? error : new AppError('Authentication failed', 500);
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith(baseUrl)) {
          const path = url.substring(baseUrl.length);
          const validPaths = ['/dashboard', '/todos', '/templates', '/brainstorms', '/groups', '/profile'];
          if (validPaths.some(validPath => path.startsWith(validPath))) {
            return url;
          }
        }
        return `${baseUrl}/dashboard`;
      } catch (error) {
        console.error('Redirect error:', error);
        return `${baseUrl}/dashboard`;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
        }
        return token;
      } catch (error) {
        console.error('JWT error:', error);
        throw new AppError('Failed to generate token', 500, 'JWT_ERROR');
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
        }
        return session;
      } catch (error) {
        console.error('Session error:', error);
        throw new AppError('Failed to create session', 500, 'SESSION_ERROR');
      }
    }
  },
  events: {
    signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email}`, { isNewUser });
    },
    signOut({ session, token }) {
      console.log(`User signed out: ${token.email}`);
    },
    createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },
    updateUser({ user }) {
      console.log(`User updated: ${user.email}`);
    },
    linkAccount({ user, account, profile }) {
      console.log(`Account linked for user: ${user.email}`);
    },
    session({ session, token }) {
      console.log(`Session created for user: ${session.user.email}`);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
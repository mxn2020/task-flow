// lib/auth.ts:
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from './supabaseClient';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Please enter both email and password');
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !profile) {
          throw new Error('Invalid email or password');
        }

        const isValid = await compare(credentials.password, profile.password_hash);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        const path = url.substring(baseUrl.length);
        if (
          path.startsWith('/dashboard') ||
          path.startsWith('/todos') ||
          path.startsWith('/templates') ||
          path.startsWith('/brainstorms') ||
          path.startsWith('/groups') ||
          path.startsWith('/profile')) {
          return url;
        }
      }
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
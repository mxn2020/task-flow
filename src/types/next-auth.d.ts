// types/next-auth.d.ts

import "next-auth"
import { DefaultJWT } from 'next-auth/jwt';

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    is_suspended: boolean;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: string;
      is_suspended: boolean;
    }
  }
  interface User {
    role: string;
    is_suspended: boolean;
  }
}
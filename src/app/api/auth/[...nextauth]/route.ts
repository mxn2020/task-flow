// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/errors/errorHandler";

async function handler(req: Request, context: { params: { nextauth: string[] } }) {
  try {
    const nextAuthHandler = NextAuth(authOptions);
    return nextAuthHandler(req, context);
  } catch (error) {
    console.error("NextAuth Error:", error);
    return new Response(
      JSON.stringify({
        error: "Authentication error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

export { handler as GET, handler as POST };
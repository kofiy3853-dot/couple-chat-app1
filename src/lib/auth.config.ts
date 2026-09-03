import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as Record<string, unknown>).username as string | null;
        token.role = (user as Record<string, unknown>).role as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as Record<string, unknown>).username = token.username;
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

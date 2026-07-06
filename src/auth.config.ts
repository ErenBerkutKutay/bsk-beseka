import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: "ADMIN" | "B2B" }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "ADMIN" | "B2B";
      return session;
    },
  },
  pages: {
    signIn: "/tr/b2b",
  },
  session: { strategy: "jwt" as const },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

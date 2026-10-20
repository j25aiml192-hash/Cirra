import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth v5 Configuration for Cirra
 * Google OAuth Provider with Supabase / PostgreSQL token exchange placeholder
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // Tenant and role context injected from token claims or Supabase lookup
        (session.user as unknown as { tenantId: string; role: string }).tenantId =
          (token.tenantId as string) ?? "demo-tenant-id";
        (session.user as unknown as { tenantId: string; role: string }).role =
          (token.role as string) ?? "admin";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = "demo-tenant-id";
        token.role = "admin";
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "cirra-dev-auth-secret-min-32-chars",
});

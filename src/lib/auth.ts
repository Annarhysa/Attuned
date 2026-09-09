import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_MAX_AGE = 24 * 60 * 60; // 1 day when "remember me" is unchecked

/**
 * "Remember me" needs a per-sign-in session lifetime, which NextAuth v4
 * doesn't expose as static config -- so the route handler builds these
 * options fresh per request, reading the `remember` field posted alongside
 * the credentials. See src/app/api/auth/[...nextauth]/route.ts.
 */
export function buildAuthOptions(remember: boolean): NextAuthOptions {
  return {
    session: { strategy: 'jwt', maxAge: remember ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE },
    pages: { signIn: '/login' },
    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
          remember: { label: 'Remember me', type: 'text' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user) return null;
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          // Email verification is informational only (a clickable link, sent on
          // signup and resendable from the dashboard) -- it never blocks login.
          return { id: user.id, email: user.email, name: user.name || undefined };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) token.id = user.id;
        return token;
      },
      async session({ session, token }) {
        if (session.user) (session.user as { id?: string }).id = token.id as string;
        return session;
      },
    },
  };
}

// Default options (remember=true) for anywhere that needs a static reference,
// e.g. getServerSession() calls outside the NextAuth route handler.
export const authOptions = buildAuthOptions(true);

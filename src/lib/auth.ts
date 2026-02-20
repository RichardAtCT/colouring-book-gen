import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

const providers: Parameters<typeof NextAuth>[0]["providers"] = [Google];

// Dev-only credentials provider for testing
if (process.env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      name: "Test Account",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        // Find or create the test user
        let user = await db.query.users.findFirst({
          where: eq(schema.users.email, email),
        });

        if (!user) {
          const id = crypto.randomUUID();
          await db.insert(schema.users).values({
            id,
            email,
            name: "Test Creator",
            plan: "creator",
            generationsToday: 0,
            generationsThisMonth: 0,
            createdAt: new Date(),
          });
          user = await db.query.users.findFirst({
            where: eq(schema.users.email, email),
          });
        }

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

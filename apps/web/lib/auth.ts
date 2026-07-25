import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";

const ROOT_EMAILS = ["admin@uniteddistribution.com"];

async function getUserRole(
  userId: number
): Promise<{ role: string; tenantId?: number } | null> {
  if (!db) return null;
  const tu = await db
    .select()
    .from(schema.tenantUsers)
    .where(eq(schema.tenantUsers.userId, userId))
    .limit(1)
    .then((r) => r[0]);
  if (!tu) return null;
  return { role: tu.role, tenantId: tu.tenantId };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (!db) return null;

        const user = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, credentials.email as string))
          .limit(1)
          .then((r) => r[0]);

        if (!user) return null;

        if (!user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        if (!db) return false;
        const existing = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, user.email))
          .limit(1)
          .then((r) => r[0]);

        if (!existing && ROOT_EMAILS.includes(user.email)) {
          const [created] = await db
            .insert(schema.users)
            .values({
              email: user.email,
              name: user.name ?? "Developer",
            })
            .returning();

          if (created && user.email === ROOT_EMAILS[0]) {
            const platformTenant = await db
              .select()
              .from(schema.tenants)
              .where(eq(schema.tenants.slug, "platform"))
              .limit(1)
              .then((r) => r[0]);

            if (platformTenant) {
              await db.insert(schema.tenantUsers).values({
                tenantId: platformTenant.id,
                userId: created.id,
                role: "root",
              });
            }
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = "user";

        if (user.email && ROOT_EMAILS.includes(user.email)) {
          token.role = "root";
        } else {
          const roleInfo = await getUserRole(Number(user.id));
          if (roleInfo) {
            token.role = roleInfo.role;
            token.tenantId = roleInfo.tenantId;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
});

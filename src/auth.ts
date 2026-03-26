import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  // リバースプロキシ配下でも NextAuth がリクエストホストを信頼できるようにする
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "メール", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email;
        const passwordRaw = credentials?.password;
        if (!emailRaw || !passwordRaw) return null;
        const email = String(emailRaw).trim().toLowerCase();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!user) return null;
        const ok = await compare(String(passwordRaw), user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // ログイン直後だけ DB の id / 管理者を JWT に載せ、以降の session から参照する
      if (user) {
        token.id = user.id;
        token.isAdmin = Boolean(user.isAdmin);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});

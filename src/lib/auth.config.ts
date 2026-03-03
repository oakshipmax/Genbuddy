import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Edge互換設定（Prisma不使用・Node.jsモジュール不使用）
 * ミドルウェアでのセッション確認専用。完全な設定は auth.ts を参照。
 *
 * 【重要】Cookie名を明示することで、Node.js（サインイン）と
 * Edge runtime（ミドルウェア）でCookie名が必ず一致するようにする。
 * process.env.AUTH_URL の値に依存しない設計。
 */
const authConfig: NextAuthConfig = {
  providers: [],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },

  // Amplifyなど本番環境でのホスト信頼設定（必須）
  trustHost: true,

  // Cookie名を環境ごとに明示（AUTH_URLの値に依存しないようにする）
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
  },
};

export default authConfig;

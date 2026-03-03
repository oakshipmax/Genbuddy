import type { NextAuthConfig } from "next-auth";

/**
 * Edge互換設定（Prisma不使用・Node.jsモジュール不使用）
 * ミドルウェアでのセッション確認専用。
 * 完全な設定は auth.ts を参照。
 */
const authConfig: NextAuthConfig = {
  providers: [], // ミドルウェアではsign-inしないので空でOK

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },

  // Amplifyなど本番環境でのホスト信頼設定（必須）
  trustHost: true,
};

export default authConfig;

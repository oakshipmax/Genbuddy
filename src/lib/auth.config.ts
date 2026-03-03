import type { NextAuthConfig } from "next-auth";

/**
 * 本番環境でAUTH_URLがlocalhostになっている場合のフォールバック。
 * auth.config.ts はミドルウェア（Edge runtime）でも読み込まれるため、
 * auth.ts と同じ対策をここにも記載する。
 *
 * 【正しい対処法】AmplifyのAUTH_URL環境変数を変更または削除する:
 *   変更: AUTH_URL=https://main.d14eim0s9aym4u.amplifyapp.com
 *   削除: trustHost: true があるので不要
 */
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_APP_URL &&
  (!process.env.AUTH_URL || process.env.AUTH_URL.includes("localhost"))
) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
}

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

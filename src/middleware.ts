import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

/**
 * Auth.js v5 推奨パターン:
 * - auth.config.ts（Edge互換・Prismaなし）ベースのNextAuthインスタンスを使用
 * - Prismaや Node.js専用モジュールをEdgeランタイムに持ち込まない
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 認証不要のパス
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/payment") ||
    pathname.startsWith("/liff") ||
    pathname.startsWith("/api/liff");

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 未ログインはloginへ
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

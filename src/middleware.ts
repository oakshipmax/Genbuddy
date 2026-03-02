import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/payment") ||
    pathname.startsWith("/liff") ||
    pathname.startsWith("/api/liff");

  // 公開パスはそのまま通す
  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    const session = await auth();

    // 未ログインはloginへ
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // ログイン済みでloginページにアクセスしたらダッシュボードへ
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    // 認証設定が未完了の場合はloginページへ
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * エンドユーザーの案件一覧取得（LIFF用）
 * lineUserId をクエリパラメータで受け取る
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lineUserId = searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId は必須です" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { lineUserId },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    const cases = await prisma.case.findMany({
      where: { clientId: user.id },
      select: {
        id: true,
        title: true,
        status: true,
        scheduledAt: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cases);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * エンドユーザーの案件詳細取得（LIFF用）
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const caseItem = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        address: true,
        scheduledAt: true,
        handyman: { select: { name: true } },
        invoices: {
          select: {
            id: true,
            type: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!caseItem) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(caseItem);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

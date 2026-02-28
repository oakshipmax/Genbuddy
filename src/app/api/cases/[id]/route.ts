import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 案件詳細取得
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const caseItem = await prisma.case.findUnique({
      where: { id },
      include: {
        handyman: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        messages: {
          include: { sender: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!caseItem) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    // 便利屋は自分の担当案件のみ閲覧可
    if (
      session.user.role === "HANDYMAN" &&
      caseItem.handymanId !== session.user.dbId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(caseItem);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// ステータス更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, handymanId } = body;

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    // 便利屋はステータスのみ変更可（IN_PROGRESS / COMPLETED のみ）
    if (session.user.role === "HANDYMAN") {
      const allowed = ["IN_PROGRESS", "COMPLETED"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "変更できないステータスです" }, { status: 403 });
      }
    }

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(handymanId !== undefined && { handymanId }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

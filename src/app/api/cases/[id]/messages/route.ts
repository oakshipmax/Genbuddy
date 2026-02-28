import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineMessage, lineMessages } from "@/lib/line";

type RouteParams = { params: Promise<{ id: string }> };

// メッセージ一覧取得
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: caseId } = await params;

  // 便利屋は自分の担当案件のみ
  if (session.user.role === "HANDYMAN") {
    const caseItem = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseItem || caseItem.handymanId !== session.user.dbId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const messages = await prisma.message.findMany({
      where: { caseId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// メッセージ送信
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: caseId } = await params;

  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        caseId,
        senderId: session.user.dbId,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // LINE通知：相手方に新着メッセージを通知
    const caseItem = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        handyman: { select: { lineUserId: true } },
      },
    });

    if (caseItem) {
      // 本部が送信 → 便利屋に通知
      if (session.user.role === "HEADQUARTERS" && caseItem.handyman?.lineUserId) {
        await sendLineMessage(
          caseItem.handyman.lineUserId,
          lineMessages.newMessage(caseItem.title, message.sender.name)
        );
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
  }
}

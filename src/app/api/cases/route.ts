import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 案件一覧取得
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const cases = await prisma.case.findMany({
      where: {
        // 便利屋は自分の担当案件のみ取得
        ...(session.user.role === "HANDYMAN" && {
          handymanId: session.user.dbId,
        }),
        // ステータスフィルター
        ...(status && { status: status as never }),
      },
      include: {
        handyman: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cases);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// 案件登録（本部のみ）
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, address, scheduledAt, handymanId } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "タイトルと内容は必須です" },
        { status: 400 }
      );
    }

    const newCase = await prisma.case.create({
      data: {
        title,
        description,
        address: address ?? null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        handymanId: handymanId ?? null,
        status: "PENDING",
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch {
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}

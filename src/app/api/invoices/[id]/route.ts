import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// 請求書詳細取得
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            address: true,
            client: { select: { name: true } },
          },
        },
        issuedBy: { select: { name: true } },
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// ステータス更新（DRAFT→SENT→PAID）
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { status } = await req.json();

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === "SENT" && { issuedAt: new Date() }),
        ...(status === "PAID" && { paidAt: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

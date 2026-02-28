import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 請求書一覧取得
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        case: { select: { id: true, title: true } },
        issuedBy: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// 請求書・見積書作成
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, caseId, items, note } = body;

    if (!type || !caseId || !items?.length) {
      return NextResponse.json(
        { error: "種別・案件・明細は必須です" },
        { status: 400 }
      );
    }

    const totalAmount = items.reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        type,
        caseId,
        issuedById: session.user.dbId,
        totalAmount,
        note: note ?? null,
        status: "DRAFT",
        items: {
          create: items.map((item: {
            name: string;
            quantity: number;
            unitPrice: number;
            amount: number;
          }) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}

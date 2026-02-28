import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

/**
 * Stripe Checkout セッション作成
 * 請求書IDをもとに決済ページURLを生成する
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId は必須です" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { case: { select: { title: true } } },
    });

    if (!invoice) {
      return NextResponse.json({ error: "請求書が見つかりません" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "この請求書はすでに支払済みです" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutUrl = await createCheckoutSession({
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      caseTitle: invoice.case.title,
      successUrl: `${appUrl}/payment/success?invoiceId=${invoice.id}`,
      cancelUrl: `${appUrl}/payment/cancel?invoiceId=${invoice.id}`,
    });

    // Stripe未設定の場合
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Stripe が未設定のため決済を処理できません" },
        { status: 503 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch {
    return NextResponse.json({ error: "決済セッションの作成に失敗しました" }, { status: 500 });
  }
}

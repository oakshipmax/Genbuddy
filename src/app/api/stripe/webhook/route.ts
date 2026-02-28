import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/stripe";

/**
 * Stripe Webhookハンドラー
 *
 * 【Stripe Dashboardでの設定】
 * エンドポイントURL: https://your-domain.com/api/stripe/webhook
 * 受信イベント: checkout.session.completed
 */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const event = constructWebhookEvent(payload, signature);

  // Stripe未設定の場合は200を返してスキップ
  if (!event) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      // 決済完了
      case "checkout.session.completed": {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId) {
          // 請求書を支払済みに更新
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "PAID",
              paidAt: new Date(),
            },
          });
          console.log(`[Stripe] 請求書 ${invoiceId} の支払いが完了しました`);
        }
        break;
      }

      default:
        console.log(`[Stripe] 未処理のイベント: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe] Webhook処理エラー:", err);
    return NextResponse.json({ error: "Webhook処理に失敗しました" }, { status: 500 });
  }
}

// StripeはJSON bodyをそのまま検証するためbodyParserを無効化
export const config = {
  api: { bodyParser: false },
};

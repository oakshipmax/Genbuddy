/**
 * Stripe Connect ユーティリティ
 *
 * 【設定方法】
 * https://dashboard.stripe.com/ でアカウント作成後、
 * 以下を .env.local に設定してください：
 *   STRIPE_SECRET_KEY=sk_test_xxxx
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
 *   STRIPE_WEBHOOK_SECRET=whsec_xxxx  ← Webhookエンドポイント登録後に取得
 *
 * 【Stripe Connectとは】
 * プラットフォーム（ゲンバディ）が決済を受け取り、
 * 便利屋（Connected Account）へ自動で分配する仕組み。
 */

import Stripe from "stripe";

// サーバーサイド用Stripeクライアント
// キー未設定時は起動エラーを防ぐためnullを返す
export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn("[Stripe] STRIPE_SECRET_KEY が未設定のためStripeをスキップします");
    return null;
  }
  return new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
}

/**
 * Checkout Session を作成する（エンドユーザーの決済）
 * @param invoiceId 請求書ID
 * @param amount 金額（円）
 * @param caseTitle 案件タイトル
 * @param successUrl 決済成功時のリダイレクト先
 * @param cancelUrl キャンセル時のリダイレクト先
 */
export async function createCheckoutSession(params: {
  invoiceId: string;
  amount: number;
  caseTitle: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: { name: `【ゲンバディ】${params.caseTitle}` },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { invoiceId: params.invoiceId },
  });

  return session.url;
}

/**
 * Webhookのシグネチャを検証する
 */
export function constructWebhookEvent(
  payload: string,
  signature: string
): Stripe.Event | null {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.warn("[Stripe] Webhook設定が未完了のためスキップします");
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe] Webhookシグネチャ検証エラー:", err);
    return null;
  }
}

/**
 * LINE Messaging API ユーティリティ
 *
 * 【設定方法】
 * LINE Developers (https://developers.line.biz/) で以下を取得し
 * .env.local に設定してください：
 *   LINE_CHANNEL_ACCESS_TOKEN=xxxx
 *
 * 【通知が届く条件】
 * - 通知先ユーザーがLINEログイン済みであること（lineUserIdがDBに保存済み）
 * - LINE公式アカウントを友だち追加済みであること
 */

const LINE_API_URL = "https://api.line.me/v2/bot/message/push";

type TextMessage = {
  type: "text";
  text: string;
};

/**
 * 指定したLINEユーザーにプッシュ通知を送る
 */
export async function sendLineMessage(
  lineUserId: string,
  message: string
): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  // トークンが未設定の場合はスキップ（開発中は通知しない）
  if (!token) {
    console.warn("[LINE] LINE_CHANNEL_ACCESS_TOKEN が未設定のため通知をスキップしました");
    return;
  }

  const body: { to: string; messages: TextMessage[] } = {
    to: lineUserId,
    messages: [{ type: "text", text: message }],
  };

  const res = await fetch(LINE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("[LINE] 送信エラー:", error);
  }
}

/**
 * 通知メッセージテンプレート
 */
export const lineMessages = {
  // 案件ステータス変更通知（便利屋向け）
  caseStatusChanged: (caseTitle: string, status: string): string => {
    const statusLabel: Record<string, string> = {
      ASSIGNED:    "担当者に決定しました",
      IN_PROGRESS: "対応中に変更されました",
      COMPLETED:   "完了しました",
      CANCELLED:   "キャンセルされました",
    };
    return `【ゲンバディ】案件「${caseTitle}」のステータスが「${statusLabel[status] ?? status}」に更新されました。`;
  },

  // 新規メッセージ通知
  newMessage: (caseTitle: string, senderName: string): string => {
    return `【ゲンバディ】案件「${caseTitle}」に${senderName}からメッセージが届きました。アプリを確認してください。`;
  },

  // 新規案件割り当て通知（便利屋向け）
  caseAssigned: (caseTitle: string): string => {
    return `【ゲンバディ】新しい案件「${caseTitle}」が割り当てられました。詳細をアプリで確認してください。`;
  },
};

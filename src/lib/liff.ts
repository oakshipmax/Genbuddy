/**
 * LINE LIFF (LINE Front-end Framework) ユーティリティ
 *
 * 【設定方法】
 * LINE Developers で LIFF アプリを作成後、以下を .env.local に設定：
 *   NEXT_PUBLIC_LIFF_ID=xxxx-xxxxxxxx
 *
 * 【LINE申請の流れ】
 * 1. LINE Developers → チャンネル → LIFF タブ → 「追加」
 * 2. エンドポイントURL: https://your-domain.com/liff
 * 3. スコープ: profile, openid
 * 4. LINEミニアプリとして申請（審査あり）
 */

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

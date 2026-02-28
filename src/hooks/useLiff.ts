"use client";

import { useEffect, useState } from "react";
import { LIFF_ID } from "@/lib/liff";

type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type LiffState = {
  isReady: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  profile: LiffProfile | null;
  error: string | null;
};

/**
 * LIFFの初期化とユーザー情報取得を行うフック
 */
export function useLiff() {
  const [state, setState] = useState<LiffState>({
    isReady: false,
    isLoggedIn: false,
    isInClient: false,
    profile: null,
    error: null,
  });

  useEffect(() => {
    if (!LIFF_ID) {
      setState((prev) => ({
        ...prev,
        isReady: true,
        error: "LIFF IDが設定されていません（開発中）",
      }));
      return;
    }

    // LIFF SDKの動的インポート（サーバーサイドでは実行しない）
    import("@line/liff").then(async ({ default: liff }) => {
      try {
        await liff.init({ liffId: LIFF_ID });

        const isLoggedIn = liff.isLoggedIn();
        const isInClient = liff.isInClient();

        // 未ログインの場合はLINEログインへリダイレクト
        if (!isLoggedIn) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();

        setState({
          isReady: true,
          isLoggedIn: true,
          isInClient,
          profile: {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          },
          error: null,
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isReady: true,
          error: `LIFF初期化エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
        }));
      }
    });
  }, []);

  return state;
}

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
        <p className="text-gray-500 text-sm mb-6">
          システムの設定を確認中です。しばらくしてから再度お試しください。
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            再試行
          </Button>
          <Button onClick={() => (window.location.href = "/login")}>
            ログインページへ
          </Button>
        </div>
      </div>
    </div>
  );
}

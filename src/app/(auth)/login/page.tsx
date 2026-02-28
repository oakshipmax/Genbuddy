"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Tab = "handyman" | "headquarters";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>("handyman");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 便利屋・エンドユーザー：LINEログイン
  const handleLineLogin = async () => {
    setIsLoading(true);
    await signIn("line", { callbackUrl: "/dashboard" });
  };

  // 本部：Cognitoログイン（メール/パスワード）
  const handleHeadquartersLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("cognito", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* ロゴ */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ゲンバディ</h1>
        <p className="text-gray-500 mt-1 text-sm">便利屋業務管理システム</p>
      </div>

      {/* タブ切り替え */}
      <div className="flex rounded-lg bg-gray-200 p-1 mb-4">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "handyman"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("handyman")}
        >
          便利屋ログイン
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === "headquarters"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("headquarters")}
        >
          本部ログイン
        </button>
      </div>

      {/* 便利屋ログイン */}
      {activeTab === "handyman" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">LINEでログイン</CardTitle>
            <CardDescription>
              LINEアカウントでかんたんにログインできます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 text-base"
              onClick={handleLineLogin}
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEでログイン
            </Button>
            <p className="text-xs text-gray-400 text-center mt-4">
              初めての方はログイン後に自動でアカウントが作成されます
            </p>
          </CardContent>
        </Card>
      )}

      {/* 本部ログイン */}
      {activeTab === "headquarters" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">本部スタッフログイン</CardTitle>
            <CardDescription>
              登録済みのメールアドレスとパスワードでログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleHeadquartersLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@genbuddy.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

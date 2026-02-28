"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiff } from "@/hooks/useLiff";
import { StatusBadge } from "@/components/cases/StatusBadge";
import type { CaseStatus } from "@prisma/client";

type Case = {
  id: string;
  title: string;
  status: CaseStatus;
  scheduledAt: string | null;
  address: string | null;
};

export default function LiffTopPage() {
  const { isReady, isLoggedIn, profile, error } = useLiff();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !profile) return;
    setIsLoading(true);
    // エンドユーザーの案件を取得
    fetch(`/api/liff/cases?lineUserId=${profile.userId}`)
      .then((r) => r.json())
      .then(setCases)
      .finally(() => setIsLoading(false));
  }, [isLoggedIn, profile]);

  // 初期化中
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  // 開発中（LIFF ID未設定）
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          <p className="font-medium mb-1">開発モード</p>
          <p>{error}</p>
          <p className="mt-2 text-xs">NEXT_PUBLIC_LIFF_ID を設定すると本番動作します。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* ユーザー情報 */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        {profile?.pictureUrl && (
          <img
            src={profile.pictureUrl}
            alt={profile.displayName}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <p className="font-bold text-gray-900">{profile?.displayName} さん</p>
          <p className="text-sm text-gray-400">ご依頼中の案件</p>
        </div>
      </div>

      {/* 案件一覧 */}
      {isLoading ? (
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">依頼中の案件はありません</p>
          <p className="text-sm mt-1">担当者よりご連絡いたします</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/liff/cases/${c.id}`}>
              <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {c.address && <span>📍 {c.address}</span>}
                      {c.scheduledAt && (
                        <span>
                          🗓 {new Date(c.scheduledAt).toLocaleDateString("ja-JP")}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

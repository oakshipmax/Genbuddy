"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusBadge } from "@/components/cases/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { CaseStatus } from "@prisma/client";

type CaseDetail = {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  address: string | null;
  scheduledAt: string | null;
  createdAt: string;
};

export default function HandymanCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [caseItem, setCaseItem] = useState<CaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/cases/${params.id}`)
      .then((r) => r.json())
      .then(setCaseItem)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleStatusChange = async (nextStatus: CaseStatus) => {
    setIsUpdating(true);
    await fetch(`/api/cases/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const updated = await fetch(`/api/cases/${params.id}`).then((r) => r.json());
    setCaseItem(updated);
    setIsUpdating(false);
  };

  if (isLoading) return <div className="p-6 text-gray-400">読み込み中...</div>;
  if (!caseItem) return <div className="p-6 text-red-500">案件が見つかりません</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← 戻る
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">
          {caseItem.title}
        </h1>
        <StatusBadge status={caseItem.status} />
      </div>

      <div className="space-y-4">
        {/* 案件情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">作業内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-gray-900 whitespace-pre-wrap">{caseItem.description}</p>
            {caseItem.address && (
              <p className="text-gray-600">📍 {caseItem.address}</p>
            )}
            {caseItem.scheduledAt && (
              <p className="text-gray-600">
                🗓 {new Date(caseItem.scheduledAt).toLocaleString("ja-JP")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ステータス操作（便利屋は対応中・完了のみ） */}
        {caseItem.status === "ASSIGNED" && (
          <Button
            className="w-full"
            onClick={() => handleStatusChange("IN_PROGRESS")}
            disabled={isUpdating}
          >
            作業を開始する
          </Button>
        )}
        {caseItem.status === "IN_PROGRESS" && (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handleStatusChange("COMPLETED")}
            disabled={isUpdating}
          >
            作業を完了する
          </Button>
        )}
        {(caseItem.status === "COMPLETED" || caseItem.status === "CANCELLED") && (
          <p className="text-center text-sm text-gray-400">
            この案件は{caseItem.status === "COMPLETED" ? "完了" : "キャンセル"}済みです
          </p>
        )}

        {/* チャット */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">本部とのチャット</CardTitle>
          </CardHeader>
          <div className="h-[400px] flex flex-col">
            {session?.user?.dbId && (
              <ChatWindow
                caseId={caseItem.id}
                currentUserId={session.user.dbId}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

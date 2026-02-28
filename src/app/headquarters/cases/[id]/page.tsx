"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/cases/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CaseStatus } from "@prisma/client";

type CaseDetail = {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  address: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  handyman: { id: string; name: string } | null;
};

const nextStatusMap: Partial<Record<CaseStatus, { status: CaseStatus; label: string }>> = {
  PENDING: { status: "ASSIGNED", label: "担当者決定にする" },
  ASSIGNED: { status: "IN_PROGRESS", label: "対応中にする" },
  IN_PROGRESS: { status: "COMPLETED", label: "完了にする" },
};

export default function HeadquartersCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  const handleCancel = async () => {
    if (!confirm("この案件をキャンセルしますか？")) return;
    setIsUpdating(true);
    await fetch(`/api/cases/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    router.push("/headquarters/cases");
  };

  if (isLoading) {
    return <div className="p-6 text-gray-400">読み込み中...</div>;
  }

  if (!caseItem) {
    return <div className="p-6 text-red-500">案件が見つかりません</div>;
  }

  const nextStep = nextStatusMap[caseItem.status];

  return (
    <div className="p-4 max-w-2xl mx-auto">
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
            <CardTitle className="text-base">案件情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">作業内容</p>
              <p className="text-gray-900 whitespace-pre-wrap">{caseItem.description}</p>
            </div>
            {caseItem.address && (
              <div>
                <p className="text-gray-500 text-xs mb-0.5">作業場所</p>
                <p className="text-gray-900">📍 {caseItem.address}</p>
              </div>
            )}
            {caseItem.scheduledAt && (
              <div>
                <p className="text-gray-500 text-xs mb-0.5">予定日時</p>
                <p className="text-gray-900">
                  🗓 {new Date(caseItem.scheduledAt).toLocaleString("ja-JP")}
                </p>
              </div>
            )}
            {caseItem.handyman && (
              <div>
                <p className="text-gray-500 text-xs mb-0.5">担当便利屋</p>
                <p className="text-gray-900">👤 {caseItem.handyman.name}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs mb-0.5">登録日時</p>
              <p className="text-gray-900">
                {new Date(caseItem.createdAt).toLocaleString("ja-JP")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ステータス操作 */}
        {caseItem.status !== "COMPLETED" && caseItem.status !== "CANCELLED" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ステータス変更</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nextStep && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange(nextStep.status)}
                  disabled={isUpdating}
                >
                  {nextStep.label}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                キャンセルにする
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

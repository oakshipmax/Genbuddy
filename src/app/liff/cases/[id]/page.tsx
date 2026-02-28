"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiff } from "@/hooks/useLiff";
import { StatusBadge } from "@/components/cases/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CaseStatus } from "@prisma/client";

type Invoice = {
  id: string;
  type: string;
  status: string;
  totalAmount: number;
};

type CaseDetail = {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  address: string | null;
  scheduledAt: string | null;
  handyman: { name: string } | null;
  invoices: Invoice[];
};

const statusSteps: CaseStatus[] = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];
const stepLabel: Record<CaseStatus, string> = {
  PENDING:     "受付待ち",
  ASSIGNED:    "担当者決定",
  IN_PROGRESS: "作業中",
  COMPLETED:   "完了",
  CANCELLED:   "キャンセル",
};

export default function LiffCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isReady } = useLiff();
  const [caseItem, setCaseItem] = useState<CaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetch(`/api/liff/cases/${params.id}`)
      .then((r) => r.json())
      .then(setCaseItem)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handlePayment = async (invoiceId: string) => {
    setIsPaying(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "決済の準備に失敗しました");
      setIsPaying(false);
    }
  };

  if (!isReady || isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">読み込み中...</div>;
  }

  if (!caseItem) {
    return <div className="p-6 text-red-500">案件が見つかりません</div>;
  }

  const currentStep = statusSteps.indexOf(caseItem.status);
  const unpaidInvoices = caseItem.invoices.filter(
    (inv) => inv.type === "INVOICE" && inv.status !== "PAID" && inv.status !== "CANCELLED"
  );

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 戻る
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 truncate">{caseItem.title}</h1>
      </div>

      <div className="space-y-4">
        {/* 進捗ステップ */}
        {caseItem.status !== "CANCELLED" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">作業の進捗</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        i <= currentStep
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}>
                        {i < currentStep ? "✓" : i + 1}
                      </div>
                      <span className="text-xs text-gray-500 mt-1 text-center leading-tight">
                        {stepLabel[step]}
                      </span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < currentStep ? "bg-blue-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 案件情報 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">ご依頼内容</CardTitle>
              <StatusBadge status={caseItem.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-gray-900 whitespace-pre-wrap">{caseItem.description}</p>
            {caseItem.address && <p className="text-gray-500">📍 {caseItem.address}</p>}
            {caseItem.scheduledAt && (
              <p className="text-gray-500">
                🗓 {new Date(caseItem.scheduledAt).toLocaleString("ja-JP")}
              </p>
            )}
            {caseItem.handyman && (
              <p className="text-gray-500">👤 担当: {caseItem.handyman.name}</p>
            )}
          </CardContent>
        </Card>

        {/* 支払いセクション */}
        {unpaidInvoices.length > 0 && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-base text-blue-700">お支払い</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unpaidInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      ご請求金額
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ¥{inv.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => handlePayment(inv.id)}
                    disabled={isPaying}
                  >
                    {isPaying ? "処理中..." : "お支払いへ"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {caseItem.status === "COMPLETED" && unpaidInvoices.length === 0 && (
          <div className="text-center py-6 bg-green-50 rounded-xl border border-green-200">
            <p className="text-green-700 font-medium">✅ 作業・お支払いが完了しました</p>
            <p className="text-green-500 text-sm mt-1">ご利用ありがとうございました</p>
          </div>
        )}
      </div>
    </div>
  );
}

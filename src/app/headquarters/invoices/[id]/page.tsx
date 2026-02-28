"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type InvoiceItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Invoice = {
  id: string;
  type: string;
  status: string;
  totalAmount: number;
  note: string | null;
  issuedAt: string | null;
  createdAt: string;
  case: {
    id: string;
    title: string;
    address: string | null;
    client: { name: string } | null;
  };
  issuedBy: { name: string };
  items: InvoiceItem[];
};

const statusMap: Record<string, { next: string; label: string; nextLabel: string }> = {
  DRAFT: { next: "SENT",  label: "下書き",   nextLabel: "送付済みにする" },
  SENT:  { next: "PAID",  label: "送付済み",  nextLabel: "支払済みにする" },
  PAID:  { next: "",      label: "支払済み",  nextLabel: "" },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((r) => r.json())
      .then(setInvoice)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleStatusChange = async (nextStatus: string) => {
    setIsUpdating(true);
    await fetch(`/api/invoices/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const updated = await fetch(`/api/invoices/${params.id}`).then((r) => r.json());
    setInvoice(updated);
    setIsUpdating(false);
  };

  if (isLoading) return <div className="p-6 text-gray-400">読み込み中...</div>;
  if (!invoice) return <div className="p-6 text-red-500">見つかりません</div>;

  const statusInfo = statusMap[invoice.status];
  const typeLabel = invoice.type === "INVOICE" ? "請求書" : "見積書";

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* 操作バー（印刷時は非表示） */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">
          ← 戻る
        </button>
        <div className="flex-1" />
        {statusInfo?.next && (
          <Button
            size="sm"
            onClick={() => handleStatusChange(statusInfo.next)}
            disabled={isUpdating}
          >
            {statusInfo.nextLabel}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.print()}
        >
          印刷 / PDF
        </Button>
      </div>

      {/* 請求書本体（印刷対応レイアウト） */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 print:border-none print:shadow-none">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{typeLabel}</h1>
            <p className="text-sm text-gray-400 mt-1">
              作成日: {new Date(invoice.createdAt).toLocaleDateString("ja-JP")}
            </p>
            {invoice.issuedAt && (
              <p className="text-sm text-gray-400">
                発行日: {new Date(invoice.issuedAt).toLocaleDateString("ja-JP")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">ゲンバディ本部</p>
            <p className="text-sm text-gray-500 mt-0.5">担当: {invoice.issuedBy.name}</p>
          </div>
        </div>

        {/* 宛先 */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-1">宛先</p>
          <p className="text-lg font-bold text-gray-900">
            {invoice.case.client?.name ?? "（クライアント未設定）"} 様
          </p>
          <p className="text-sm text-gray-500 mt-0.5">案件: {invoice.case.title}</p>
          {invoice.case.address && (
            <p className="text-sm text-gray-500">📍 {invoice.case.address}</p>
          )}
        </div>

        {/* 明細テーブル */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">品目</th>
              <th className="text-center py-2 text-gray-500 font-medium w-16">数量</th>
              <th className="text-right py-2 text-gray-500 font-medium w-24">単価</th>
              <th className="text-right py-2 text-gray-500 font-medium w-24">小計</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.name}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">¥{item.unitPrice.toLocaleString()}</td>
                <td className="py-3 text-right text-gray-900 font-medium">¥{item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 合計 */}
        <div className="flex justify-end mb-8">
          <div className="text-right bg-gray-50 rounded-lg px-6 py-4">
            <p className="text-sm text-gray-500">合計金額（税込）</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ¥{invoice.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 備考 */}
        {invoice.note && (
          <div className="border-t pt-4">
            <p className="text-xs text-gray-400 mb-1">備考</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type CaseOption = {
  id: string;
  title: string;
};

const emptyItem = (): LineItem => ({
  name: "",
  quantity: 1,
  unitPrice: 0,
  amount: 0,
});

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCaseId = searchParams.get("caseId") ?? "";

  const [type, setType] = useState<"INVOICE" | "ESTIMATE">("INVOICE");
  const [caseId, setCaseId] = useState(defaultCaseId);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data) => setCases(data.map((c: CaseOption) => ({ id: c.id, title: c.title }))));
  }, []);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // 小計を自動計算
      next[index].amount = next[index].quantity * next[index].unitPrice;
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) { setError("案件を選択してください"); return; }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, caseId, items, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "作成に失敗しました");
      }

      const invoice = await res.json();
      router.push(`/headquarters/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← 戻る</button>
        <h1 className="text-2xl font-bold text-gray-900">新規作成</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 種別・案件選択 */}
        <Card>
          <CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* 種別タブ */}
            <div>
              <Label>種別</Label>
              <div className="flex rounded-lg bg-gray-100 p-1 mt-1 w-fit">
                {(["INVOICE", "ESTIMATE"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      type === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                    onClick={() => setType(t)}
                  >
                    {t === "INVOICE" ? "請求書" : "見積書"}
                  </button>
                ))}
              </div>
            </div>

            {/* 案件選択 */}
            <div>
              <Label htmlFor="caseId">対象案件 <span className="text-red-500">*</span></Label>
              <select
                id="caseId"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">案件を選択してください</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 明細 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">明細</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                ＋ 行を追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* ヘッダー行 */}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1">
                <span className="col-span-5">品目</span>
                <span className="col-span-2 text-center">数量</span>
                <span className="col-span-2 text-right">単価</span>
                <span className="col-span-2 text-right">小計</span>
                <span className="col-span-1" />
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5 text-sm"
                    placeholder="作業内容など"
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                    required
                  />
                  <Input
                    className="col-span-2 text-sm text-center"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  />
                  <Input
                    className="col-span-2 text-sm text-right"
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                  />
                  <span className="col-span-2 text-sm text-right text-gray-700">
                    ¥{item.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    className="col-span-1 text-gray-300 hover:text-red-400 text-lg text-center"
                    onClick={() => removeItem(i)}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* 合計 */}
              <div className="border-t pt-3 flex justify-end">
                <div className="text-right">
                  <p className="text-xs text-gray-400">合計（税込）</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ¥{totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 備考 */}
        <Card>
          <CardHeader><CardTitle className="text-base">備考</CardTitle></CardHeader>
          <CardContent>
            <textarea
              placeholder="支払期限・振込先など"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "作成中..." : `${type === "INVOICE" ? "請求書" : "見積書"}を作成する`}
        </Button>
      </form>
    </div>
  );
}

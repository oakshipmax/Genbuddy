import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: "下書き",   className: "bg-gray-100 text-gray-600" },
  SENT:      { label: "送付済み", className: "bg-blue-100 text-blue-700" },
  PAID:      { label: "支払済み", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "キャンセル", className: "bg-red-100 text-red-600" },
};

export default async function InvoicesPage() {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") redirect("/login");

  const invoices = await prisma.invoice.findMany({
    include: {
      case: { select: { title: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">請求書・見積書</h1>
        <Link href="/headquarters/invoices/new">
          <button className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            ＋ 新規作成
          </button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">まだ作成されていません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const s = statusLabel[inv.status] ?? statusLabel.DRAFT;
            return (
              <Link key={inv.id} href={`/headquarters/invoices/${inv.id}`}>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-400 transition-colors flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">
                        {inv.type === "INVOICE" ? "請求書" : "見積書"}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {inv.case.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(inv.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-gray-900">
                      ¥{inv.totalAmount.toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

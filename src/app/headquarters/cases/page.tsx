import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/cases/StatusBadge";
import { Button } from "@/components/ui/button";

export default async function HeadquartersCasesPage() {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    redirect("/login");
  }

  const cases = await prisma.case.findMany({
    include: {
      handyman: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">案件管理</h1>
        <Link href="/headquarters/cases/new">
          <Button>＋ 新規案件登録</Button>
        </Link>
      </div>

      {/* 案件一覧 */}
      {cases.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">案件がまだありません</p>
          <p className="text-sm mt-1">右上のボタンから案件を登録してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/headquarters/cases/${c.id}`}>
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {c.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {c.handyman && <span>担当: {c.handyman.name}</span>}
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

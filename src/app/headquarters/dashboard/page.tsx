import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { StatusBadge } from "@/components/cases/StatusBadge";

type CaseWithHandyman = Prisma.CaseGetPayload<{
  include: { handyman: { select: { name: true } } };
}>;

type StatCardProps = {
  label: string;
  value: number;
  color: string;
  href?: string;
};

function StatCard({ label, value, color, href }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-xl border-l-4 ${color} p-4 shadow-sm`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">
        {value}
        <span className="text-base font-normal text-gray-400 ml-1">件</span>
      </p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function HeadquartersDashboardPage() {
  let session;
  try {
    session = await auth();
  } catch {
    redirect("/login");
  }
  if (!session || session.user.role !== "HEADQUARTERS") {
    redirect("/login");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // DB接続エラー時はフォールバック表示
  let stats = { pending: 0, assigned: 0, inProgress: 0, completedToday: 0, total: 0 };
  let recentCases: CaseWithHandyman[] = [];
  let dbError = false;
  let dbErrorMessage = "";

  try {
    // count系は Promise.all でまとめて取得
    const [pending, assigned, inProgress, completedToday, total] =
      await Promise.all([
        prisma.case.count({ where: { status: "PENDING" } }),
        prisma.case.count({ where: { status: "ASSIGNED" } }),
        prisma.case.count({ where: { status: "IN_PROGRESS" } }),
        prisma.case.count({
          where: { status: "COMPLETED", completedAt: { gte: todayStart } },
        }),
        prisma.case.count({ where: { status: { not: "CANCELLED" } } }),
      ]);
    stats = { pending, assigned, inProgress, completedToday, total };

    // findMany はリレーション include のため別クエリ（型推論を明確化）
    recentCases = await prisma.case.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { status: { not: "CANCELLED" } },
      include: { handyman: { select: { name: true } } },
    });
  } catch (error) {
    console.error("[Dashboard] DB query error:", error);
    dbError = true;
    if (error instanceof Error) {
      dbErrorMessage = error.message;
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* DB接続エラー時のバナー */}
      {dbError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          <p className="font-medium">データベースへの接続に失敗しました</p>
          <p className="mt-1 text-red-500">
            しばらく待ってから再読み込みしてください。問題が続く場合はAmplifyのDATABASE_URL環境変数とRDSのセキュリティグループを確認してください。
          </p>
          {dbErrorMessage && (
            <p className="mt-2 text-xs text-red-400 font-mono break-all">
              {dbErrorMessage}
            </p>
          )}
        </div>
      )}

      {/* 集計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="受付待ち"
          value={stats.pending}
          color="border-yellow-400"
          href="/headquarters/cases?status=PENDING"
        />
        <StatCard
          label="担当者決定"
          value={stats.assigned}
          color="border-blue-400"
          href="/headquarters/cases?status=ASSIGNED"
        />
        <StatCard
          label="対応中"
          value={stats.inProgress}
          color="border-purple-400"
          href="/headquarters/cases?status=IN_PROGRESS"
        />
        <StatCard
          label="今日の完了"
          value={stats.completedToday}
          color="border-green-400"
        />
      </div>

      {/* 全体件数バナー */}
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
        <span className="text-sm font-medium">稼働中の案件（合計）</span>
        <span className="text-2xl font-bold">
          {stats.total}
          <span className="text-base font-normal ml-1 opacity-70">件</span>
        </span>
      </div>

      {/* 直近の案件 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">直近の案件</h2>
          <Link
            href="/headquarters/cases"
            className="text-sm text-blue-600 hover:underline"
          >
            すべて見る →
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border">
            <p>{dbError ? "データを取得できませんでした" : "案件がまだありません"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCases.map((c) => (
              <Link key={c.id} href={`/headquarters/cases/${c.id}`}>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-400 transition-colors flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.handyman ? `担当: ${c.handyman.name}` : "担当者未定"}

                      {c.scheduledAt
                        ? new Date(c.scheduledAt).toLocaleDateString("ja-JP")
                        : "日程未定"}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

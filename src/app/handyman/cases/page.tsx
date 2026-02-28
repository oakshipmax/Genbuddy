import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/cases/StatusBadge";

export default async function HandymanCasesPage() {
  const session = await auth();
  if (!session || session.user.role !== "HANDYMAN") {
    redirect("/login");
  }

  const cases = await prisma.case.findMany({
    where: { handymanId: session.user.dbId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">担当案件</h1>

      {cases.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">担当案件はありません</p>
          <p className="text-sm mt-1">本部から案件が割り当てられると表示されます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/handyman/cases/${c.id}`}>
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {c.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
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

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HeadquartersDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== "HEADQUARTERS") {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">本部ダッシュボード</h1>
      <p className="text-gray-500 mt-1">ようこそ、{session.user.name} さん</p>
      {/* TODO: フェーズ1④でダッシュボード本体を実装 */}
    </div>
  );
}

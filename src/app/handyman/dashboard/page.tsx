import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HandymanDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== "HANDYMAN") {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
      <p className="text-gray-500 mt-1">ようこそ、{session.user.name} さん</p>
      {/* TODO: フェーズ1③で案件管理を実装 */}
    </div>
  );
}

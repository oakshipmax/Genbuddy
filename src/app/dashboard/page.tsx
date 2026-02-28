import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // ロール別にリダイレクト
  switch (session.user.role) {
    case "HEADQUARTERS":
      redirect("/headquarters/dashboard");
    case "HANDYMAN":
      redirect("/handyman/dashboard");
    case "END_USER":
      redirect("/liff");
    default:
      redirect("/login");
  }
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default async function HandymanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "HANDYMAN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role="HANDYMAN" userName={session.user.name ?? "便利屋"} />
      <main>{children}</main>
    </div>
  );
}

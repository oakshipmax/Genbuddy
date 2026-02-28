import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default async function HeadquartersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "HEADQUARTERS") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role="HEADQUARTERS" userName={session.user.name ?? "本部スタッフ"} />
      <main>{children}</main>
    </div>
  );
}

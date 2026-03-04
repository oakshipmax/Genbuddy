import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default async function HeadquartersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
    console.log("[HQ Layout] auth() result:", {
      hasSession: !!session,
      role: session?.user?.role ?? "undefined",
    });
  } catch (error) {
    console.error("[HQ Layout] auth() threw an error:", error);
    redirect("/login");
  }
  if (!session || session.user.role !== "HEADQUARTERS") {
    console.warn("[HQ Layout] Access denied. Role:", session?.user?.role);
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role="HEADQUARTERS" userName={session.user.name ?? "本部スタッフ"} />
      <main>{children}</main>
    </div>
  );
}

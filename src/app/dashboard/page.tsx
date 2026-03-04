import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  let session;
  try {
    session = await auth();
    console.log("[/dashboard] auth() result:", {
      hasSession: !!session,
      role: session?.user?.role ?? "undefined",
      dbId: session?.user?.dbId ? "set" : "not set",
    });
  } catch (error) {
    console.error("[/dashboard] auth() threw an error:", error);
    redirect("/login");
  }

  if (!session) {
    console.warn("[/dashboard] No session found, redirecting to /login");
    redirect("/login");
  }

  const role = session.user?.role;
  console.log("[/dashboard] Redirecting based on role:", role);

  switch (role) {
    case "HEADQUARTERS":
      redirect("/headquarters/dashboard");
    case "HANDYMAN":
      redirect("/handyman/dashboard");
    case "END_USER":
      redirect("/liff");
    default:
      console.warn("[/dashboard] Unknown role:", role, "→ redirecting to /login");
      redirect("/login");
  }
}

import { redirect } from "next/navigation";

// ルート（/）はログインページへリダイレクト
export default function RootPage() {
  redirect("/login");
}

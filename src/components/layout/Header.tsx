"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

type NavItem = { label: string; href: string };

const hqNav: NavItem[] = [
  { label: "ダッシュボード", href: "/headquarters/dashboard" },
  { label: "案件管理", href: "/headquarters/cases" },
];

const handymanNav: NavItem[] = [
  { label: "担当案件", href: "/handyman/cases" },
];

type Props = {
  role: Role;
  userName: string;
};

export function Header({ role, userName }: Props) {
  const pathname = usePathname();
  const navItems = role === "HEADQUARTERS" ? hqNav : handymanNav;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* ロゴ */}
        <span className="font-bold text-gray-900 text-lg">ゲンバディ</span>

        {/* ナビゲーション */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ユーザー情報・ログアウト */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}

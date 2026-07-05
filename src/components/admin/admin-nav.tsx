"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  LogOut,
  MapPin,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/participants", label: "참여자", icon: Users },
  { href: "/admin/scores", label: "점수·정산", icon: Trophy },
  { href: "/admin/rooms", label: "방 배정", icon: UsersRound },
  { href: "/admin/venues", label: "장소", icon: MapPin },
  { href: "/admin/nicknames", label: "닉네임", icon: Link2 },
];

export function AdminNav() {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <header className="border-b border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              날려보세
            </p>
            <h1 className="text-lg font-bold text-zinc-900">관리자</h1>
          </div>
          <nav className="flex flex-wrap gap-1">
            {links.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </header>
  );
}

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function Header() {
  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo size="md" />
        <nav className="flex items-center gap-2">
          <Link
            href="/stats"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-emerald-50 hover:text-emerald-800"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">통계</span>
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
          >
            관리자
          </Link>
        </nav>
      </div>
    </header>
  );
}

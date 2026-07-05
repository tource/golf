"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Link2,
  MapPin,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import { RoundForm } from "@/components/admin/round-form";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminRoundBar } from "@/components/admin/admin-round-bar";
import { useAdminRound } from "@/hooks/use-admin-round";

const shortcuts = [
  {
    href: "/admin/participants",
    label: "참여자 관리",
    description: "신청 현황, 마감, 삭제",
    icon: Users,
    color: "emerald",
  },
  {
    href: "/admin/scores",
    label: "점수·정산",
    description: "스코어 입력, 비용, 커피",
    icon: Trophy,
    color: "violet",
  },
  {
    href: "/admin/rooms",
    label: "방 배정",
    description: "팀(방) 구성",
    icon: UsersRound,
    color: "sky",
  },
  {
    href: "/admin/nicknames",
    label: "닉네임 매핑",
    description: "앱 닉네임 ↔ 회원명",
    icon: Link2,
    color: "amber",
  },
  {
    href: "/admin/venues",
    label: "장소 관리",
    description: "스크린골프장 등록",
    icon: MapPin,
    color: "orange",
  },
] as const;

const colorClasses = {
  emerald: "border-emerald-100 bg-emerald-50/50 hover:border-emerald-200 hover:bg-emerald-50",
  violet: "border-violet-100 bg-violet-50/50 hover:border-violet-200 hover:bg-violet-50",
  sky: "border-sky-100 bg-sky-50/50 hover:border-sky-200 hover:bg-sky-50",
  amber: "border-amber-100 bg-amber-50/50 hover:border-amber-200 hover:bg-amber-50",
  orange: "border-orange-100 bg-orange-50/50 hover:border-orange-200 hover:bg-orange-50",
} as const;

const iconClasses = {
  emerald: "text-emerald-600",
  violet: "text-violet-600",
  sky: "text-sky-600",
  amber: "text-amber-600",
  orange: "text-orange-600",
} as const;

export function AdminHome() {
  const { rounds, roundId, selectedRound, loading, setRoundId, refreshRounds, roundHref } =
    useAdminRound();

  return (
    <AdminPageShell>
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-6 w-6 text-emerald-600" />
        <div>
          <h2 className="text-xl font-bold text-zinc-900">관리자 대시보드</h2>
          <p className="text-sm text-zinc-500">라운드 생성 및 메뉴 바로가기</p>
        </div>
      </div>

      <RoundForm onCreated={refreshRounds} />

      {!loading && rounds.length > 0 && (
        <AdminRoundBar
          rounds={rounds}
          selectedId={roundId}
          onSelect={setRoundId}
          title="작업할 라운드"
          description="아래 메뉴는 선택한 라운드 기준으로 이동합니다"
        />
      )}

      {selectedRound && (
        <p className="text-center text-sm text-zinc-500">
          현재 선택:{" "}
          <strong className="text-zinc-800">{selectedRound.title}</strong>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map(({ href, label, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href.includes("/nicknames") || href.includes("/venues") ? href : roundHref(href)}
            className={`rounded-2xl border p-5 transition ${colorClasses[color]}`}
          >
            <Icon className={`mb-3 h-6 w-6 ${iconClasses[color]}`} />
            <p className="font-bold text-zinc-900">{label}</p>
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          </Link>
        ))}
      </div>
    </AdminPageShell>
  );
}

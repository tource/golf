"use client";

import { MapPin } from "lucide-react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { VenueManager } from "@/components/admin/venue-manager";

export function AdminVenuesPage() {
  return (
    <AdminPageShell>
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <MapPin className="h-5 w-5 text-emerald-600" />
          장소 관리
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          라운드 생성 시 선택할 스크린골프장을 등록·수정합니다
        </p>
        <VenueManager />
      </div>
    </AdminPageShell>
  );
}

"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminRoundBar } from "@/components/admin/admin-round-bar";
import { RoomAssignmentManager } from "@/components/round/room-assignment-manager";
import { useAdminRound } from "@/hooks/use-admin-round";

export function AdminRoomsPage() {
  const { rounds, roundId, selectedRound, loading, setRoundId, refreshRounds } =
    useAdminRound();

  if (loading) {
    return (
      <AdminPageShell>
        <p className="text-sm text-zinc-400">불러오는 중...</p>
      </AdminPageShell>
    );
  }

  if (rounds.length === 0) {
    return (
      <AdminPageShell>
        <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
          등록된 라운드가 없습니다. 대시보드에서 라운드를 먼저 만드세요.
        </p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell>
      <AdminRoundBar
        rounds={rounds}
        selectedId={roundId}
        onSelect={setRoundId}
        title="방 배정"
        description="추첨 전 팀(방) 구성을 미리 배정합니다"
      />

      {selectedRound && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <RoomAssignmentManager round={selectedRound} onUpdated={refreshRounds} />
        </section>
      )}
    </AdminPageShell>
  );
}

"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminRoundBar } from "@/components/admin/admin-round-bar";
import { AdminScoreForm } from "@/components/admin/admin-score-form";
import { useAdminRound } from "@/hooks/use-admin-round";

export function AdminScoresPage() {
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
        title="점수·정산"
        description="스코어 캡처 업로드, 수동 입력, 비용 정산, 커피 내기"
      />

      {selectedRound && (
        <AdminScoreForm
          round={selectedRound}
          onSaved={() => {
            refreshRounds();
          }}
        />
      )}
    </AdminPageShell>
  );
}

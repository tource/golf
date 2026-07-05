"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Lock, Trash2, Unlock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { participantsToCSV, downloadCSV } from "@/lib/utils/csv";
import { AdminRoundBar } from "@/components/admin/admin-round-bar";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { useAdminRound } from "@/hooks/use-admin-round";
import type { Participant } from "@/lib/types/database";

export function AdminParticipantsPage() {
  const {
    rounds,
    roundId,
    selectedRound,
    loading,
    setRoundId,
    refreshRounds,
  } = useAdminRound();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filter, setFilter] = useState<"all" | "attending" | "absent">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchParticipants = useCallback(async () => {
    if (!roundId) return;
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("round_id", roundId)
      .order("created_at", { ascending: true });
    if (data) setParticipants(data as Participant[]);
  }, [roundId, supabase]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const filtered = participants.filter((p) => {
    if (filter === "attending") return p.is_attending;
    if (filter === "absent") return !p.is_attending;
    return true;
  });

  async function handleCloseRound() {
    if (!roundId) return;
    await supabase.from("rounds").update({ status: "closed" }).eq("id", roundId);
    refreshRounds();
  }

  async function handleReopenRound() {
    if (!roundId) return;
    await supabase.from("rounds").update({ status: "open" }).eq("id", roundId);
    refreshRounds();
  }

  function handleCSV() {
    const csv = participantsToCSV(participants);
    downloadCSV(csv, `participants-${selectedRound?.title ?? "round"}.csv`);
  }

  async function handleDeleteParticipant(participant: Participant) {
    const ok = window.confirm(
      `"${participant.name}" 참여자를 삭제할까요?\n방 배정이 있으면 함께 제거됩니다.`,
    );
    if (!ok) return;

    setDeletingId(participant.id);
    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("id", participant.id);
    setDeletingId(null);

    if (error) {
      alert(`삭제에 실패했습니다: ${error.message}`);
      return;
    }
    fetchParticipants();
  }

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
        title="참여자 관리"
        description="신청 현황 확인, 마감 처리, 참여자 삭제"
      />

      {selectedRound && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-zinc-900">참여자 목록</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "attending", "absent"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {f === "all" ? "전체" : f === "attending" ? "참여" : "불참"}
                </button>
              ))}
              <button
                type="button"
                onClick={handleCSV}
                className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {selectedRound.status === "open" && (
              <button
                type="button"
                onClick={handleCloseRound}
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                <Lock className="h-4 w-4" />
                신청 마감
              </button>
            )}
            {selectedRound.status === "closed" && (
              <button
                type="button"
                onClick={handleReopenRound}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                <Unlock className="h-4 w-4" />
                재오픈
              </button>
            )}
            {selectedRound.status !== "open" && (
              <a
                href={`/round/${roundId}`}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                회원용 결과 페이지
              </a>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">
                    참여
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">
                    신청시간
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">
                    스코어
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-zinc-600">
                    한마디
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-zinc-600">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-zinc-400"
                    >
                      참여자가 없습니다
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {p.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            p.is_attending
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {p.is_attending ? "참여" : "불참"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(p.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-700">
                        {p.score != null ? p.score : "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {p.comment ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteParticipant(p)}
                          disabled={deletingId === p.id}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === p.id ? "삭제 중" : "삭제"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminPageShell>
  );
}

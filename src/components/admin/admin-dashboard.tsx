"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Users, LogOut, Lock, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { participantsToCSV, downloadCSV } from "@/lib/utils/csv";
import { RoundForm, RoundSelector } from "@/components/admin/round-form";
import { VenueManager } from "@/components/admin/venue-manager";
import { RoomAssignmentManager } from "@/components/round/room-assignment-manager";
import type { Participant, Round } from "@/lib/types/database";

export function AdminDashboard() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filter, setFilter] = useState<"all" | "attending" | "absent">("all");
  const supabase = createClient();

  const fetchRounds = useCallback(async () => {
    const { data } = await supabase
      .from("rounds")
      .select("*")
      .order("date", { ascending: false });
    if (data) {
      setRounds(data as Round[]);
      setSelectedRoundId((prev) => prev || data[0]?.id || "");
    }
  }, [supabase]);

  const fetchParticipants = useCallback(async () => {
    if (!selectedRoundId) return;
    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("round_id", selectedRoundId)
      .order("created_at", { ascending: true });
    if (data) setParticipants(data as Participant[]);
  }, [selectedRoundId, supabase]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  const filtered = participants.filter((p) => {
    if (filter === "attending") return p.is_attending;
    if (filter === "absent") return !p.is_attending;
    return true;
  });

  async function handleCloseRound() {
    if (!selectedRoundId) return;
    await supabase
      .from("rounds")
      .update({ status: "closed" })
      .eq("id", selectedRoundId);
    fetchRounds();
  }

  async function handleReopenRound() {
    if (!selectedRoundId) return;
    await supabase
      .from("rounds")
      .update({ status: "open" })
      .eq("id", selectedRoundId);
    fetchRounds();
  }

  function handleCSV() {
    const csv = participantsToCSV(participants);
    downloadCSV(csv, `participants-${selectedRound?.title ?? "round"}.csv`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">관리자 대시보드</h1>
            <p className="text-sm text-zinc-500">날려보세</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <RoundForm onCreated={fetchRounds} />

        {rounds.length > 0 && selectedRound && (
          <>
            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-zinc-900">참여자 현황</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "attending", "absent"] as const).map((f) => (
                    <button
                      key={f}
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
                    onClick={handleCSV}
                    className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <RoundSelector
                  rounds={rounds}
                  selectedId={selectedRoundId}
                  onSelect={setSelectedRoundId}
                />
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {selectedRound.status === "open" && (
                  <button
                    onClick={handleCloseRound}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    <Lock className="h-4 w-4" />
                    신청 마감
                  </button>
                )}
                {selectedRound.status === "closed" && (
                  <button
                    onClick={handleReopenRound}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    <Unlock className="h-4 w-4" />
                    재오픈
                  </button>
                )}
                {selectedRound.status !== "open" && (
                  <a
                    href={`/round/${selectedRoundId}`}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    점수·정산 페이지
                  </a>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">이름</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">참여</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">신청시간</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">스코어</th>
                      <th className="px-4 py-3 text-left font-semibold text-zinc-600">한마디</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                          참여자가 없습니다
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p.id} className="border-b border-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{p.name}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.is_attending ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                              {p.is_attending ? "참여" : "불참"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            {new Date(p.created_at).toLocaleString("ko-KR")}
                          </td>
                          <td className="px-4 py-3 font-medium text-emerald-700">
                            {p.score != null ? `${p.score}타` : "-"}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{p.comment ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-zinc-900">
                방 배정 <span className="text-sm font-normal text-zinc-400">(선택)</span>
              </h2>
              <RoomAssignmentManager
                round={selectedRound}
                onUpdated={fetchRounds}
              />
            </section>
          </>
        )}

        <VenueManager />
      </main>
    </div>
  );
}

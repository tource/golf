"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/ui/header";
import { HomeSkeleton } from "@/components/ui/skeleton";
import { Countdown } from "@/components/home/countdown";
import {
  RoundHistoryList,
  type RoundHistoryItem,
} from "@/components/home/round-history-list";
import type { RoundWithVenue } from "@/lib/types/database";

export function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [openRound, setOpenRound] = useState<RoundWithVenue | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [history, setHistory] = useState<RoundHistoryItem[]>([]);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: openRounds } = await supabase
      .from("rounds")
      .select("*, venues(*)")
      .eq("status", "open")
      .order("date", { ascending: true })
      .limit(1);

    if (openRounds?.[0]) {
      const round = openRounds[0] as RoundWithVenue;
      setOpenRound(round);

      const { count } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("round_id", round.id)
        .eq("is_attending", true);

      setParticipantCount(count ?? 0);
    }

    const { data: pastRounds } = await supabase
      .from("rounds")
      .select("*, venues(*)")
      .in("status", ["closed", "drawn", "completed"])
      .order("date", { ascending: false });

    if (pastRounds && pastRounds.length > 0) {
      const roundIds = pastRounds.map((r) => r.id);

      const [{ data: allParticipants }, { data: settlements }] =
        await Promise.all([
          supabase
            .from("participants")
            .select("round_id, name, score, is_attending")
            .in("round_id", roundIds)
            .eq("is_attending", true),
          supabase
            .from("round_settlements")
            .select("round_id, total_cost")
            .in("round_id", roundIds),
        ]);

      const settlementMap = new Map(
        (settlements ?? []).map((s) => [s.round_id, s.total_cost]),
      );

      const items: RoundHistoryItem[] = pastRounds.map((round) => {
        const r = round as RoundWithVenue;
        const roundParticipants = (allParticipants ?? []).filter(
          (p) => p.round_id === r.id,
        );
        const scored = roundParticipants
          .filter((p) => p.score != null)
          .sort((a, b) => (a.score ?? 999) - (b.score ?? 999));
        const winner = scored[0];

        return {
          round: r,
          participantCount: roundParticipants.length,
          winnerName: winner?.name ?? null,
          winnerScore: winner?.score ?? null,
          totalCost: settlementMap.get(r.id) ?? null,
        };
      });

      setHistory(items);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxCapacity = openRound
    ? openRound.room_count * openRound.players_per_room
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            {openRound ? (
              <section className="mb-10 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
                <p className="text-center text-sm font-semibold text-emerald-600">
                  {openRound.title}
                </p>
                <div className="my-8">
                  <Countdown targetDate={openRound.date} />
                </div>

                <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    {new Date(openRound.date).toLocaleString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    {openRound.venues.name}
                  </span>
                </div>

                <div className="mb-8 rounded-2xl bg-emerald-50 p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-800">
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">참여 신청 현황</span>
                  </div>
                  <p className="mt-2 text-4xl font-black text-emerald-700">
                    {participantCount}
                    <span className="text-lg font-medium text-zinc-400">
                      {" "}/ {maxCapacity}명
                    </span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <Link
                    href={`/participate?round=${openRound.id}`}
                    className="flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                  >
                    참여 신청하기
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </section>
            ) : (
              <section className="mb-10 rounded-3xl border border-zinc-100 bg-white p-12 text-center shadow-sm">
                <p className="text-lg font-medium text-zinc-600">
                  현재 모집 중인 라운드가 없습니다
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-zinc-900">
                역대 라운드
                {history.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-zinc-400">
                    {history.length}경기
                  </span>
                )}
              </h2>
              <RoundHistoryList items={history} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

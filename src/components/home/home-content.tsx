"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/ui/header";
import { HomeSkeleton } from "@/components/ui/skeleton";
import { Countdown } from "@/components/home/countdown";
import { RoundSummary } from "@/components/round/round-summary";
import { fetchRoundResult } from "@/lib/utils/round-data";
import type { RoundResultData, RoundWithVenue } from "@/lib/types/database";

export function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [openRound, setOpenRound] = useState<RoundWithVenue | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [recentResult, setRecentResult] = useState<RoundResultData | null>(
    null,
  );
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

    // drawn 또는 completed 상태의 최근 라운드
    const { data: recentRounds } = await supabase
      .from("rounds")
      .select("id")
      .in("status", ["drawn", "completed"])
      .order("date", { ascending: false })
      .limit(1);

    if (recentRounds?.[0]) {
      const result = await fetchRoundResult(recentRounds[0].id);
      setRecentResult(result);
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
                      {" "}
                      / {maxCapacity}명
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
                  현재 모집 중인 모임이 없습니다
                </p>
              </section>
            )}

            {recentResult && (
              <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-zinc-900">
                  최근 라운드 결과
                </h2>
                <RoundSummary data={recentResult} compact showLink={false} />
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/round/${recentResult.round.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    전체 결과 보기
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  {recentResult.assignments.length > 0 && (
                    <Link
                      href={`/draw/${recentResult.round.id}?skip=1`}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-5 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
                    >
                      방 배정 보기
                    </Link>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

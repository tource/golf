"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/ui/header";
import { HomeSkeleton } from "@/components/ui/skeleton";
import { Countdown } from "@/components/home/countdown";
import {
  RoundHistoryList,
  type RoundHistoryItem,
} from "@/components/home/round-history-list";
import { VenueInfo } from "@/components/ui/venue-info";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { MyRoomCard } from "@/components/ui/my-room-card";
import type { RoundWithVenue } from "@/lib/types/database";
import { getRoundStageInfo } from "@/lib/utils/round-stage";

interface FeaturedRound {
  round: RoundWithVenue;
  participantCount: number;
  assignmentCount: number;
  hasSettlement: boolean;
}

export function HomeContent() {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<FeaturedRound | null>(null);
  const [history, setHistory] = useState<RoundHistoryItem[]>([]);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: openRounds } = await supabase
      .from("rounds")
      .select("*, venues(*)")
      .eq("status", "open")
      .order("date", { ascending: true })
      .limit(1);

    let featuredRound: RoundWithVenue | null =
      (openRounds?.[0] as RoundWithVenue) ?? null;

    if (!featuredRound) {
      const { data: activeRounds } = await supabase
        .from("rounds")
        .select("*, venues(*)")
        .in("status", ["closed", "drawn"])
        .order("date", { ascending: false })
        .limit(1);

      featuredRound = (activeRounds?.[0] as RoundWithVenue) ?? null;
    }

    if (featuredRound) {
      const [
        { count: participantCount },
        { count: assignmentCount },
        { data: settlement },
      ] = await Promise.all([
        supabase
          .from("participants")
          .select("*", { count: "exact", head: true })
          .eq("round_id", featuredRound.id)
          .eq("is_attending", true),
        supabase
          .from("room_assignments")
          .select("*", { count: "exact", head: true })
          .eq("round_id", featuredRound.id),
        supabase
          .from("round_settlements")
          .select("total_cost")
          .eq("round_id", featuredRound.id)
          .maybeSingle(),
      ]);

      setFeatured({
        round: featuredRound,
        participantCount: participantCount ?? 0,
        assignmentCount: assignmentCount ?? 0,
        hasSettlement: settlement?.total_cost != null,
      });
    } else {
      setFeatured(null);
    }

    const { data: pastRounds } = await supabase
      .from("rounds")
      .select("*, venues(*)")
      .eq("status", "completed")
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
    } else {
      setHistory([]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stageInfo = featured
    ? getRoundStageInfo(
        featured.round.status,
        featured.assignmentCount,
        featured.hasSettlement,
      )
    : null;

  const expectedCapacity =
    featured != null
      ? featured.round.room_count * featured.round.players_per_room
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            {featured && stageInfo ? (
              <section className="mb-10 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${stageInfo.badgeClass}`}
                  >
                    {stageInfo.label}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {stageInfo.description}
                  </span>
                </div>

                <p className="text-center text-xl font-bold text-zinc-900">
                  {featured.round.title}
                </p>

                {featured.round.status === "open" && (
                  <div className="my-8">
                    <Countdown targetDate={featured.round.date} />
                  </div>
                )}

                <div className="mb-6 flex flex-wrap justify-center gap-4 text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    {new Date(featured.round.date).toLocaleString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="mb-6 flex justify-center">
                  <VenueInfo venue={featured.round.venues} />
                </div>

                <div className="mb-8 rounded-2xl bg-emerald-50 p-5 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-800">
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">참여 신청 현황</span>
                  </div>
                  <p className="mt-2 text-4xl font-black text-emerald-700">
                    {featured.participantCount}
                    <span className="text-lg font-medium text-zinc-400">
                      {" "}
                      명 참여
                    </span>
                  </p>
                  {expectedCapacity > 0 && (
                    <p className="mt-1 text-xs text-zinc-400">
                      예상 {expectedCapacity}명 · 인원은 유동적으로 조정돼요
                    </p>
                  )}
                </div>

                {featured.assignmentCount > 0 && (
                  <div className="mb-8">
                    <MyRoomCard
                      roundId={featured.round.id}
                      assignmentCount={featured.assignmentCount}
                    />
                  </div>
                )}

                <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                  {stageInfo.stage === "open" && (
                    <>
                      <Link
                        href={`/participate?round=${featured.round.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 sm:w-auto"
                      >
                        참여 신청하기
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                      <CopyLinkButton
                        path={`/participate?round=${featured.round.id}`}
                        label="참여 링크 복사"
                      />
                    </>
                  )}

                  {stageInfo.stage !== "open" && (
                    <Link
                      href={`/round/${featured.round.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 sm:w-auto"
                    >
                      <ClipboardList className="h-4 w-4" />
                      라운드 결과 보기
                    </Link>
                  )}

                  {featured.assignmentCount > 0 && (
                    <Link
                      href={`/draw/${featured.round.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      추첨 애니메이션
                    </Link>
                  )}

                  {stageInfo.stage !== "open" && featured.assignmentCount > 0 && (
                    <CopyLinkButton
                      path={`/draw/${featured.round.id}`}
                      label="추첨 링크 복사"
                    />
                  )}
                </div>
              </section>
            ) : (
              <section className="mb-10 rounded-3xl border border-zinc-100 bg-white p-12 text-center shadow-sm">
                <p className="text-lg font-medium text-zinc-600">
                  현재 진행 중인 라운드가 없습니다
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

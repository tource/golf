"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Crown, MapPin, Coffee } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { calcAvgScores } from "@/lib/utils/round-data";

const LOADING_MESSAGES = [
  "그린 위의 데이터를 계산 중입니다...",
  "페어웨이를 달리는 중...",
  "버디 기회를 분석하고 있어요...",
  "홀인원 통계를 모으는 중...",
];

interface ScoreRank {
  name: string;
  avgScore: number;
  rounds: number;
}

interface VenueRank {
  name: string;
  count: number;
}

interface CoffeeRank {
  name: string;
  count: number;
}

interface MonthlyAvg {
  month: string;
  avgScore: number;
}

export function StatsContent() {
  const [loading, setLoading] = useState(true);
  const [loadingMsg] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)],
  );
  const [scoreRanks, setScoreRanks] = useState<ScoreRank[]>([]);
  const [venueRanks, setVenueRanks] = useState<VenueRank[]>([]);
  const [coffeeRanks, setCoffeeRanks] = useState<CoffeeRank[]>([]);
  const [monthlyAvg, setMonthlyAvg] = useState<MonthlyAvg[]>([]);
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    const { data: participants } = await supabase
      .from("participants")
      .select("name, score, is_attending, created_at")
      .not("score", "is", null);

    const { data: rounds } = await supabase
      .from("rounds")
      .select("id, date, venues(name)");

    const { data: coffeeBets } = await supabase
      .from("coffee_bets")
      .select("payer_name");

    if (participants) {
      setScoreRanks(calcAvgScores(participants));

      const monthMap = new Map<string, { total: number; count: number }>();
      participants.forEach((p) => {
        if (p.score == null) return;
        const month = new Date(p.created_at).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "short",
        });
        const cur = monthMap.get(month) ?? { total: 0, count: 0 };
        cur.total += p.score;
        cur.count++;
        monthMap.set(month, cur);
      });
      setMonthlyAvg(
        [...monthMap.entries()]
          .map(([month, { total, count }]) => ({
            month,
            avgScore: Math.round((total / count) * 10) / 10,
          }))
          .slice(-6),
      );
    }

    if (rounds) {
      const venueMap = new Map<string, number>();
      rounds.forEach((r) => {
        const venue = r.venues as unknown as { name: string } | null;
        const name = venue?.name ?? "알 수 없음";
        venueMap.set(name, (venueMap.get(name) ?? 0) + 1);
      });
      setVenueRanks(
        [...venueMap.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      );
    }

    if (coffeeBets) {
      const map = new Map<string, number>();
      coffeeBets.forEach((b) => {
        map.set(b.payer_name, (map.get(b.payer_name) ?? 0) + 1);
      });
      setCoffeeRanks(
        [...map.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      );
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-2xl font-bold text-zinc-900">동아리 통계</h1>

        {loading ? (
          <div className="space-y-6">
            <p className="text-center text-sm font-medium text-emerald-600 animate-pulse">
              {loadingMsg}
            </p>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
                <Crown className="h-5 w-5 text-amber-500" />
                평균 타수 랭킹
                <span className="text-xs font-normal text-zinc-400">
                  (낮을수록 상위)
                </span>
              </h2>
              {scoreRanks.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  아직 입력된 스코어가 없습니다
                </p>
              ) : (
                <ol className="space-y-2">
                  {scoreRanks.map((m, i) => (
                    <li
                      key={m.name}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 text-center text-sm font-bold text-zinc-400">
                          {i === 0 ? "👑" : i + 1}
                        </span>
                        <span className="font-semibold text-zinc-900">
                          {m.name}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        {m.avgScore}타
                        <span className="ml-1 text-xs font-normal text-zinc-400">
                          ({m.rounds}라운드)
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  인기 매장 TOP 3
                </h2>
                {venueRanks.length === 0 ? (
                  <p className="text-sm text-zinc-400">데이터가 없습니다</p>
                ) : (
                  <ul className="space-y-3">
                    {venueRanks.map((v, i) => (
                      <li key={v.name} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-zinc-900">{v.name}</p>
                          <p className="text-xs text-zinc-500">{v.count}회 방문</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
                  <Coffee className="h-5 w-5 text-orange-500" />
                  커피 내기 왕
                </h2>
                {coffeeRanks.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    아직 커피 내기 기록이 없습니다
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {coffeeRanks.map((c, i) => (
                      <li
                        key={c.name}
                        className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-2.5"
                      >
                        <span className="text-sm font-medium text-zinc-800">
                          {i === 0 ? "☕" : `${i + 1}.`} {c.name}
                        </span>
                        <span className="text-xs font-bold text-orange-600">
                          {c.count}회
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-zinc-900">
                월별 평균 타수
              </h2>
              {monthlyAvg.length === 0 ? (
                <p className="text-sm text-zinc-400">데이터가 없습니다</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyAvg}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value}타`, "평균 타수"]}
                    />
                    <Bar
                      dataKey="avgScore"
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                      name="평균 타수"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

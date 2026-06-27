"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { RoundSummary } from "@/components/round/round-summary";
import { RoundSettleForm } from "@/components/round/round-settle-form";
import { fetchRoundResult } from "@/lib/utils/round-data";
import type { RoundResultData } from "@/lib/types/database";

interface RoundResultPageProps {
  roundId: string;
}

export function RoundResultPage({ roundId }: RoundResultPageProps) {
  const [data, setData] = useState<RoundResultData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await fetchRoundResult(roundId);
    setData(result);
    setLoading(false);
  }, [roundId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-zinc-600">라운드를 찾을 수 없습니다.</p>
          <Link href="/" className="mt-4 inline-block text-emerald-700">
            홈으로
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <div className="mb-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <RoundSummary data={data} showLink={false} />
        </div>

        <RoundSettleForm data={data} onSaved={load} />

        {data.assignments.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href={`/draw/${roundId}?skip=1`}
              className="text-sm text-zinc-500 hover:text-emerald-700"
            >
              추첨 애니메이션 다시 보기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

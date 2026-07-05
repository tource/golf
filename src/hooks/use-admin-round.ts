"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Round } from "@/lib/types/database";

export function useAdminRound() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRounds = useCallback(async () => {
    const { data } = await supabase
      .from("rounds")
      .select("*")
      .order("date", { ascending: false });
    if (data) setRounds(data as Round[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const paramRoundId = searchParams.get("round");
  const roundId =
    paramRoundId && rounds.some((r) => r.id === paramRoundId)
      ? paramRoundId
      : (rounds[0]?.id ?? "");

  const selectedRound = rounds.find((r) => r.id === roundId) ?? null;

  useEffect(() => {
    if (loading || rounds.length === 0) return;
    if (!paramRoundId && roundId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("round", roundId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [loading, rounds.length, paramRoundId, roundId, pathname, router, searchParams]);

  function setRoundId(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("round", id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function roundHref(path: string) {
    return roundId ? `${path}?round=${roundId}` : path;
  }

  return {
    rounds,
    roundId,
    selectedRound,
    loading,
    setRoundId,
    refreshRounds: fetchRounds,
    roundHref,
  };
}

import { createClient } from "@/lib/supabase/client";
import type {
  AssignmentWithParticipant,
  CoffeeBet,
  Participant,
  RoundResultData,
  RoundSettlement,
  RoundWithVenue,
} from "@/lib/types/database";

export async function fetchRoundResult(
  roundId: string,
): Promise<RoundResultData | null> {
  const supabase = createClient();

  const [
    { data: roundData },
    { data: assignmentData },
    { data: participantData },
    { data: settlementData },
    { data: coffeeData },
  ] = await Promise.all([
    supabase.from("rounds").select("*, venues(*)").eq("id", roundId).single(),
    supabase
      .from("room_assignments")
      .select("*, participants(*)")
      .eq("round_id", roundId)
      .order("room_number"),
    supabase
      .from("participants")
      .select("*")
      .eq("round_id", roundId)
      .eq("is_attending", true)
      .order("name"),
    supabase.from("round_settlements").select("*").eq("round_id", roundId).maybeSingle(),
    supabase
      .from("coffee_bets")
      .select("*")
      .eq("round_id", roundId)
      .order("created_at", { ascending: false }),
  ]);

  if (!roundData) return null;

  return {
    round: roundData as RoundWithVenue,
    assignments: (assignmentData ?? []) as AssignmentWithParticipant[],
    participants: (participantData ?? []) as Participant[],
    settlement: (settlementData as RoundSettlement | null) ?? null,
    coffeeBets: (coffeeData ?? []) as CoffeeBet[],
  };
}

/** 1/n 정산 금액 (올림) */
export function calcPerPerson(totalCost: number, headCount: number): number {
  if (headCount <= 0) return 0;
  return Math.ceil(totalCost / headCount);
}

/** 멤버별 평균 타수 (낮을수록 좋음) */
export function calcAvgScores(
  participants: { name: string; score: number | null }[],
): { name: string; avgScore: number; rounds: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  participants
    .filter((p) => p.score != null)
    .forEach((p) => {
      const cur = map.get(p.name) ?? { total: 0, count: 0 };
      cur.total += p.score!;
      cur.count++;
      map.set(p.name, cur);
    });
  return [...map.entries()]
    .map(([name, { total, count }]) => ({
      name,
      avgScore: Math.round((total / count) * 10) / 10,
      rounds: count,
    }))
    .sort((a, b) => a.avgScore - b.avgScore);
}

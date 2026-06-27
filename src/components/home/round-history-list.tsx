"use client";

import Link from "next/link";
import { Calendar, ChevronRight, MapPin, Trophy, Users } from "lucide-react";
import type { RoundWithVenue } from "@/lib/types/database";
import { calcPerPerson } from "@/lib/utils/round-data";

export interface RoundHistoryItem {
  round: RoundWithVenue;
  participantCount: number;
  winnerName: string | null;
  winnerScore: number | null;
  totalCost: number | null;
}

interface RoundHistoryListProps {
  items: RoundHistoryItem[];
}

export function RoundHistoryList({ items }: RoundHistoryListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-400">
        아직 완료된 라운드가 없습니다
      </p>
    );
  }

  return (
    <ul className="divide-y divide-emerald-50">
      {items.map(({ round, participantCount, winnerName, winnerScore, totalCost }) => {
        const perPerson =
          totalCost != null && participantCount > 0
            ? calcPerPerson(totalCost, participantCount)
            : null;

        return (
          <li key={round.id}>
            <Link
              href={`/round/${round.id}`}
              className="flex items-center gap-4 px-2 py-4 transition hover:bg-emerald-50/60 rounded-xl"
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <span className="text-lg font-black leading-none">
                  {new Date(round.date).getDate()}
                </span>
                <span className="text-[10px] font-semibold uppercase">
                  {new Date(round.date).toLocaleDateString("ko-KR", {
                    month: "short",
                  })}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-900">
                  {round.title}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {round.venues.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {participantCount}명
                  </span>
                  {winnerName && winnerScore != null && (
                    <span className="flex items-center gap-1 text-amber-700">
                      <Trophy className="h-3 w-3" />
                      {winnerName} {winnerScore}타
                    </span>
                  )}
                  {perPerson != null && (
                    <span>1/n {perPerson.toLocaleString()}원</span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    round.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : round.status === "drawn"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {round.status === "completed"
                    ? "완료"
                    : round.status === "drawn"
                      ? "배정됨"
                      : "마감"}
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-300" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

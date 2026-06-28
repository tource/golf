"use client";

import Link from "next/link";
import { ChevronRight, Coffee, Receipt, Trophy, Users } from "lucide-react";
import type { RoundResultData } from "@/lib/types/database";
import { calcPerPerson, calcRoomTeamScores } from "@/lib/utils/round-data";
import { getRoomColor } from "@/lib/utils/constants";
import { VenueInfo } from "@/components/ui/venue-info";

interface RoundSummaryProps {
  data: RoundResultData;
  compact?: boolean;
  showLink?: boolean;
  highlightName?: string;
}

export function RoundSummary({
  data,
  compact = false,
  showLink = true,
  highlightName,
}: RoundSummaryProps) {
  const { round, assignments, participants, settlement, coffeeBets } = data;
  const rooms = [...new Set(assignments.map((a) => a.room_number))].sort(
    (a, b) => a - b,
  );
  const scored = participants.filter((p) => p.score != null);
  const headCount = participants.length;
  const perPerson =
    settlement?.total_cost != null
      ? calcPerPerson(settlement.total_cost, headCount)
      : null;

  const roundRanking = [...scored].sort(
    (a, b) => (a.score ?? 999) - (b.score ?? 999),
  );

  const teamScores =
    assignments.length > 0 ? calcRoomTeamScores(assignments) : [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">{round.title}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date(round.date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </p>
        <div className="mt-2">
          <VenueInfo venue={round.venues} compact />
        </div>
      </div>

      {/* 방 배정 — 배정된 경우만 표시 */}
      {assignments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            방 배정
          </p>
          <div
            className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
          >
            {rooms.map((roomNum) => {
              const color = getRoomColor(roomNum);
              const members = assignments.filter(
                (a) => a.room_number === roomNum,
              );
              const roomTotal = members.reduce(
                (sum, m) => sum + (m.participants.score ?? 0),
                0,
              );
              const scoredInRoom = members.filter(
                (m) => m.participants.score != null,
              ).length;
              return (
                <div
                  key={roomNum}
                  className={`rounded-xl border p-4 ${color.light} ${color.border}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${color.bg}`}
                    >
                      {roomNum}번 방
                    </span>
                    {scoredInRoom > 0 && (
                      <span className={`text-sm font-black ${color.text}`}>
                        합산 {roomTotal}타
                        {scoredInRoom < members.length && (
                          <span className="ml-1 text-xs font-medium text-zinc-500">
                            ({scoredInRoom}/{members.length}명)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {members.map((m) => {
                      const isMe =
                        highlightName &&
                        m.participants.name.trim() === highlightName.trim();
                      return (
                        <li
                          key={m.id}
                          className={`flex items-center justify-between text-sm ${
                            isMe
                              ? "rounded-lg bg-white/80 px-2 py-1 font-bold text-emerald-800 ring-1 ring-emerald-300"
                              : "text-zinc-900"
                          }`}
                        >
                          <span
                            className={isMe ? "" : "font-medium text-zinc-800"}
                          >
                            {m.participants.name}
                            {isMe && " (나)"}
                          </span>
                          {m.participants.score != null && (
                            <span className="text-xs font-bold text-emerald-700">
                              {m.participants.score}타
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 팀별 합산 타수 */}
      {teamScores.length > 0 && (
        <div className="rounded-xl bg-sky-50 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-sky-900">
            <Users className="h-4 w-4" />
            팀별 합산 타수
          </p>
          <ol className="space-y-2">
            {teamScores.map((team, i) => {
              const color = getRoomColor(team.roomNumber);
              const isComplete = team.scoredCount === team.memberCount;
              return (
                <li
                  key={team.roomNumber}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${color.light} ${color.border}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                    <span className="w-5 text-center">
                      {i === 0
                        ? "🥇"
                        : i === 1
                          ? "🥈"
                          : i === 2
                            ? "🥉"
                            : `${i + 1}.`}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${color.bg}`}
                    >
                      {team.roomNumber}번 방
                    </span>
                    {!isComplete && (
                      <span className="text-xs text-zinc-500">
                        {team.scoredCount}/{team.memberCount}명 입력
                      </span>
                    )}
                  </span>
                  <span className={`text-lg font-black ${color.text}`}>
                    {team.total}타
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* 이번 라운드 순위 */}
      {roundRanking.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <Trophy className="h-4 w-4" />
            이번 라운드 순위
          </p>
          <ol className="space-y-1">
            {roundRanking.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between text-sm text-zinc-900"
              >
                <span>
                  {i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `${i + 1}.`}{" "}
                  {p.name}
                </span>
                <span className="font-bold text-amber-900">{p.score}타</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 정산 */}
      {settlement?.total_cost != null && (
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
            <Receipt className="h-4 w-4" />
            비용 정산
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-zinc-600">
              총액{" "}
              <strong className="text-zinc-900">
                {settlement.total_cost.toLocaleString()}원
              </strong>
            </span>
            <span className="text-zinc-600">
              1/n ({headCount}명){" "}
              <strong className="text-emerald-700">
                {perPerson?.toLocaleString()}원
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* 커피 내기 */}
      {coffeeBets.length > 0 && (
        <div className="rounded-xl bg-orange-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-orange-800">
            <Coffee className="h-4 w-4" />
            커피 내기
          </p>
          <ul className="space-y-1">
            {coffeeBets.map((bet) => (
              <li key={bet.id} className="text-sm text-orange-900">
                ☕ <strong>{bet.payer_name}</strong>님이 커피 쏨
                {bet.note && (
                  <span className="text-orange-600"> — {bet.note}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showLink && (
        <Link
          href={`/round/${round.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          {assignments.length > 0 ? "점수·정산 입력하기" : "상세 보기"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

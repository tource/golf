"use client";

import { Coffee, Receipt, Trophy } from "lucide-react";
import type { RoundResultData } from "@/lib/types/database";
import { calcPerPerson } from "@/lib/utils/round-data";

interface RoundSettleFormProps {
  data: RoundResultData;
}

/** 회원용 — 점수·정산은 조회만 (입력은 관리자) */
export function RoundSettleForm({ data }: RoundSettleFormProps) {
  const { round, participants, settlement, coffeeBets } = data;
  const scored = participants.filter((p) => p.is_attending && p.score != null);
  const headCount = participants.filter((p) => p.is_attending).length;
  const perPerson =
    settlement?.total_cost != null && headCount > 0
      ? calcPerPerson(settlement.total_cost, headCount)
      : null;

  if (round.status === "open") {
    return (
      <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        신청 마감 후 결과가 공개됩니다.
      </p>
    );
  }

  const hasAny =
    scored.length > 0 || settlement?.total_cost != null || coffeeBets.length > 0;

  if (!hasAny) {
    return (
      <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        아직 입력된 스코어·정산이 없습니다. 관리자가 결과를 등록하면 여기에
        표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {scored.length > 0 && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
            <Trophy className="h-5 w-5 text-amber-500" />
            스코어
          </h3>
          <ul className="space-y-2">
            {scored.map((p) => (
              <li
                key={p.id}
                className="flex justify-between text-sm text-zinc-800"
              >
                <span className="font-medium">{p.name}</span>
                <span className="font-bold text-emerald-700">{p.score}타</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {settlement?.total_cost != null && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
            <Receipt className="h-5 w-5 text-emerald-600" />
            비용 정산
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-zinc-600">
              총액{" "}
              <strong className="text-zinc-900">
                {settlement.total_cost.toLocaleString()}원
              </strong>
            </span>
            {perPerson != null && (
              <span className="text-zinc-600">
                1/n ({headCount}명){" "}
                <strong className="text-emerald-700">
                  {perPerson.toLocaleString()}원
                </strong>
              </span>
            )}
          </div>
        </section>
      )}

      {coffeeBets.length > 0 && (
        <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
            <Coffee className="h-5 w-5 text-orange-500" />
            커피 내기
          </h3>
          <ul className="space-y-2">
            {coffeeBets.map((bet) => (
              <li
                key={bet.id}
                className="rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-900"
              >
                ☕ <strong>{bet.payer_name}</strong>
                {bet.note && ` — ${bet.note}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

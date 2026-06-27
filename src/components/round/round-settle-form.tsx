"use client";

import { useState } from "react";
import { Coffee, Receipt, Save, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SelectField } from "@/components/ui/select-field";
import { inputClassName, inputClassNameSm } from "@/components/ui/input-styles";
import type { RoundResultData } from "@/lib/types/database";
import { calcPerPerson } from "@/lib/utils/round-data";

interface RoundSettleFormProps {
  data: RoundResultData;
  onSaved: () => void;
}

export function RoundSettleForm({ data, onSaved }: RoundSettleFormProps) {
  const { round, participants, settlement, coffeeBets } = data;
  const supabase = createClient();

  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      participants.map((p) => [p.id, p.score?.toString() ?? ""]),
    ),
  );
  const [totalCost, setTotalCost] = useState(
    settlement?.total_cost?.toString() ?? "",
  );
  const [coffeePayer, setCoffeePayer] = useState("");
  const [coffeeNote, setCoffeeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const headCount = participants.length;
  const perPerson =
    totalCost && headCount > 0
      ? calcPerPerson(parseInt(totalCost), headCount)
      : null;

  async function handleSaveScores() {
    setSaving(true);
    setMessage("");

    for (const p of participants) {
      const val = scores[p.id];
      const score = val === "" ? null : parseInt(val);
      await supabase
        .from("participants")
        .update({ score })
        .eq("id", p.id);
    }

    if (totalCost !== "") {
      const cost = parseInt(totalCost);
      await supabase.from("round_settlements").upsert({
        round_id: round.id,
        total_cost: cost,
        updated_at: new Date().toISOString(),
      });
    }

    await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", round.id);

    setMessage("저장되었습니다!");
    setSaving(false);
    onSaved();
  }

  async function handleAddCoffee(e: React.FormEvent) {
    e.preventDefault();
    if (!coffeePayer) return;

    await supabase.from("coffee_bets").insert({
      round_id: round.id,
      payer_name: coffeePayer,
      note: coffeeNote.trim() || null,
    });

    setCoffeePayer("");
    setCoffeeNote("");
    onSaved();
  }

  if (round.status === "open") {
    return (
      <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        신청 마감 후 점수와 정산을 입력할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* 점수 입력 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <Trophy className="h-5 w-5 text-amber-500" />
          스코어 입력
        </h3>
        <div className="space-y-3">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-medium text-zinc-800">
                {p.name}
              </span>
              <input
                type="number"
                min={0}
                max={200}
                value={scores[p.id] ?? ""}
                onChange={(e) =>
                  setScores((prev) => ({ ...prev, [p.id]: e.target.value }))
                }
                placeholder="타수"
                className={inputClassNameSm}
              />
              <span className="text-sm text-zinc-400">타</span>
            </div>
          ))}
        </div>
      </section>

      {/* 총액 정산 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <Receipt className="h-5 w-5 text-emerald-600" />
          비용 정산
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              총 비용 (원)
            </label>
            <input
              type="number"
              min={0}
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              placeholder="예: 120000"
              className={inputClassName}
            />
          </div>
          {perPerson != null && (
            <div className="rounded-xl bg-emerald-50 px-6 py-4 text-center">
              <p className="text-xs text-emerald-600">1/n ({headCount}명)</p>
              <p className="text-2xl font-black text-emerald-700">
                {perPerson.toLocaleString()}
                <span className="text-sm font-medium">원</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 커피 내기 */}
      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <Coffee className="h-5 w-5 text-orange-500" />
          커피 내기
        </h3>

        {coffeeBets.length > 0 && (
          <ul className="mb-4 space-y-2">
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
        )}

        <form onSubmit={handleAddCoffee} className="flex flex-wrap gap-3">
          <SelectField
            value={coffeePayer}
            onChange={setCoffeePayer}
            options={[
              { value: "", label: "누가 쏘나요?" },
              ...participants.map((p) => ({ value: p.name, label: p.name })),
            ]}
            placeholder="누가 쏘나요?"
            className="min-w-[140px] flex-1"
          />
          <input
            value={coffeeNote}
            onChange={(e) => setCoffeeNote(e.target.value)}
            placeholder="한마디 (선택)"
            maxLength={30}
            className={`${inputClassNameSm} min-w-[160px] flex-1`}
          />
          <button
            type="submit"
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
          >
            추가
          </button>
        </form>
      </section>

      <button
        type="button"
        disabled={saving}
        onClick={handleSaveScores}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Save className="h-5 w-5" />
        {saving ? "저장 중..." : "점수·정산 저장"}
      </button>

      {message && (
        <p className="text-center text-sm font-medium text-emerald-700">
          {message}
        </p>
      )}
    </div>
  );
}

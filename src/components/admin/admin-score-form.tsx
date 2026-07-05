"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Coffee,
  ClipboardPaste,
  ImageUp,
  Loader2,
  Receipt,
  Save,
  Trophy,
  Wand2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SelectField } from "@/components/ui/select-field";
import { inputClassName, inputClassNameSm } from "@/components/ui/input-styles";
import type {
  MemberNickname,
  Participant,
  Round,
  RoundResultData,
} from "@/lib/types/database";
import { calcPerPerson, fetchRoundResult } from "@/lib/utils/round-data";
import { resolveNicknameToParticipant } from "@/lib/utils/nickname-resolve";
import { parsedScoreToInput } from "@/lib/utils/score-image-parse";
import type { ParsedScoreEntry } from "@/lib/utils/score-image-parse";
import { ocrImagesToEntries, parseImagesWithGemini } from "@/lib/utils/score-image-ocr";
import { parseScoreTextSmart } from "@/lib/utils/score-text-parse";

interface AdminScoreFormProps {
  round: Round;
  onSaved: () => void;
}

interface DraftRow {
  nickname: string;
  scoreRaw: string;
  participantId: string;
  strokes: string;
  saveMapping: boolean;
}

export function AdminScoreForm({ round, onSaved }: AdminScoreFormProps) {
  const [data, setData] = useState<RoundResultData | null>(null);
  const [mappings, setMappings] = useState<MemberNickname[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [totalCost, setTotalCost] = useState("");
  const [coffeePayer, setCoffeePayer] = useState("");
  const [coffeeNote, setCoffeeNote] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsePreview, setParsePreview] = useState<DraftRow[] | null>(null);
  const [parseMeta, setParseMeta] = useState<{ images: number; total: number } | null>(
    null,
  );
  const [parseError, setParseError] = useState("");
  const [parseProgress, setParseProgress] = useState(0);
  const [parseProgressMsg, setParseProgressMsg] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const load = useCallback(async () => {
    const [result, { data: mapData }] = await Promise.all([
      fetchRoundResult(round.id),
      supabase.from("member_nicknames").select("*"),
    ]);

    if (result) {
      setData(result);
      setScores(
        Object.fromEntries(
          result.participants.map((p) => [p.id, p.score?.toString() ?? ""]),
        ),
      );
      setTotalCost(result.settlement?.total_cost?.toString() ?? "");
    }
    if (mapData) setMappings(mapData as MemberNickname[]);
  }, [round.id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const participants = data?.participants.filter((p) => p.is_attending) ?? [];
  const knownNicknames = useMemo(
    () => mappings.map((m) => m.nickname),
    [mappings],
  );
  const headCount = participants.length;
  const perPerson =
    totalCost && headCount > 0
      ? calcPerPerson(parseInt(totalCost, 10), headCount)
      : null;

  function buildDraftRows(entries: ParsedScoreEntry[]): DraftRow[] {
    return entries.map((e) => {
      const matched = resolveNicknameToParticipant(
        e.nickname,
        mappings,
        participants,
      );
      const score = parsedScoreToInput(e);

      return {
        nickname: e.nickname,
        scoreRaw: e.scoreRaw,
        participantId: matched?.id ?? "",
        strokes: score != null ? String(score) : "",
        saveMapping: !matched && !!e.nickname,
      };
    });
  }

  function mergeDraftRows(existing: DraftRow[], incoming: DraftRow[]): DraftRow[] {
    const seen = new Set(existing.map((r) => r.nickname.trim().toLowerCase()));
    const added = incoming.filter(
      (r) => !seen.has(r.nickname.trim().toLowerCase()),
    );
    return [...existing, ...added];
  }

  function applyParsedEntries(
    entries: ParsedScoreEntry[],
    mode: "replace" | "append",
    imageCount: number,
  ) {
    const rows = buildDraftRows(entries);
    if (rows.length === 0) {
      setParseError(
        "스코어를 찾지 못했습니다. 스트로크 탭이 보이는지 확인하거나, 아래 텍스트 붙여넣기를 이용해 주세요.",
      );
      return;
    }

    setParseError("");

    if (mode === "replace") {
      setParsePreview(rows);
      setParseMeta({ images: imageCount, total: rows.length });
    } else {
      setParsePreview((prev) => {
        const merged = prev ? mergeDraftRows(prev, rows) : rows;
        setParseMeta((m) => ({
          images: (m?.images ?? 0) + imageCount,
          total: merged.length,
        }));
        return merged;
      });
    }
  }

  async function parseImages(
    files: File[],
    mode: "replace" | "append",
    engine: "ocr" | "gemini" = "ocr",
  ) {
    if (files.length === 0) return;

    setParsing(true);
    setParseError("");
    setParseProgress(0);
    setParseProgressMsg("준비 중...");

    try {
      const entries =
        engine === "gemini"
          ? await parseImagesWithGemini(files)
          : await ocrImagesToEntries(
              files,
              knownNicknames,
              (msg, pct) => {
                setParseProgressMsg(msg);
                setParseProgress(Math.round(pct));
              },
            );
      applyParsedEntries(entries, mode, files.length);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "이미지 인식에 실패했습니다.";
      setParseError(
        engine === "gemini" && msg.includes("429")
          ? "Gemini 할당량 초과입니다. OCR 분석 또는 텍스트 붙여넣기를 이용해 주세요."
          : `${msg} 텍스트 붙여넣기로 입력할 수도 있습니다.`,
      );
    } finally {
      setParsing(false);
      setParseProgress(0);
      setParseProgressMsg("");
    }
  }

  function handleTextParse(mode: "replace" | "append") {
    if (!pasteText.trim()) {
      setParseError("붙여넣을 텍스트를 입력해 주세요.");
      return;
    }
    setParsing(false);
    const entries = parseScoreTextSmart(pasteText, knownNicknames);
    applyParsedEntries(entries, mode, 0);
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "replace" | "append",
    engine: "ocr" | "gemini" = "ocr",
  ) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await parseImages(files, mode, engine);
  }

  async function applyPreview() {
    if (!parsePreview) return;

    for (const row of parsePreview) {
      if (row.saveMapping && row.participantId && row.nickname) {
        const p = participants.find((x) => x.id === row.participantId);
        if (p) {
          await supabase.from("member_nicknames").upsert(
            {
              nickname: row.nickname.trim(),
              member_name: p.name.trim(),
              note: "스코어 이미지에서 자동 등록",
            },
            { onConflict: "nickname" },
          );
        }
      }
    }

    const applied = parsePreview.filter(
      (row) => row.participantId && row.strokes !== "",
    );

    if (applied.length === 0) {
      setParseError(
        "적용할 점수가 없습니다. 참여자 매칭과 스코어를 확인한 뒤 다시 시도해 주세요.",
      );
      return;
    }

    const skipped = parsePreview.length - applied.length;
    setScores((prev) => {
      const next = { ...prev };
      for (const row of applied) {
        next[row.participantId] = row.strokes;
      }
      return next;
    });

    setParsePreview(null);
    setParseError("");
    setMessage(
      skipped > 0
        ? `${applied.length}명 점수를 적용했습니다. (${skipped}명은 매칭·스코어 미입력으로 제외) 아래에서 확인 후 저장하세요.`
        : `${applied.length}명 점수를 적용했습니다. 확인 후 저장하세요.`,
    );

    const { data: mapData } = await supabase.from("member_nicknames").select("*");
    if (mapData) setMappings(mapData as MemberNickname[]);
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setMessage("");

    for (const p of data.participants) {
      const val = scores[p.id];
      const score = val === "" || val == null ? null : parseInt(val, 10);
      await supabase.from("participants").update({ score }).eq("id", p.id);
    }

    if (totalCost !== "") {
      await supabase.from("round_settlements").upsert({
        round_id: round.id,
        total_cost: parseInt(totalCost, 10),
        updated_at: new Date().toISOString(),
      });
    }

    await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", round.id);

    setSaving(false);
    setMessage("저장되었습니다!");
    onSaved();
    load();
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
    load();
  }

  if (round.status === "open") {
    return (
      <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        신청 마감 후 점수를 입력할 수 있습니다.
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-zinc-400">라운드 데이터를 불러오는 중...</p>
    );
  }

  return (
    <div className="space-y-8">
      {/* 이미지에서 스코어 불러오기 */}
      <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <ImageUp className="h-5 w-5 text-violet-600" />
          스코어 캡처 업로드
        </h3>
        <p className="mb-4 text-sm text-zinc-600">
          <strong>스트로크</strong> 탭 캡처를 올리면 등록된{" "}
          <strong>닉네임 매핑</strong>과 대조해 인식합니다. 인원이 많으면
          1~9위 / 10위~ 나눠 여러 장 올리세요.
        </p>
        {knownNicknames.length === 0 && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            닉네임 매핑이 없으면 정확도가 떨어집니다.{" "}
            <a href="/admin/nicknames" className="font-bold underline">
              닉네임 매핑 등록
            </a>
            을 먼저 해 주세요.
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-end gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {parsing ? "인식 중..." : "OCR 분석 (무료)"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              disabled={parsing}
              onChange={(e) => handleImageUpload(e, "replace", "ocr")}
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
            {parsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            AI 고정밀 (Gemini)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              disabled={parsing}
              onChange={(e) => handleImageUpload(e, "replace", "gemini")}
            />
          </label>
          {parsePreview && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-200">
              {parsing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageUp className="h-4 w-4" />
              )}
              이어서 추가
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                disabled={parsing}
                onChange={(e) => handleImageUpload(e, "append", "ocr")}
              />
            </label>
          )}
        </div>

        {parsing && (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-violet-700">
              <span>{parseProgressMsg || "처리 중..."}</span>
              <span>{parseProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              첫 실행 시 언어 데이터 다운로드로 10~30초 걸릴 수 있습니다.
            </p>
          </div>
        )}

        <div className="mb-4 rounded-xl border border-dashed border-violet-200 bg-white/80 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
            <ClipboardPaste className="h-4 w-4 text-violet-500" />
            텍스트 붙여넣기 (OCR 실패 시)
          </p>
          <p className="mb-2 text-xs text-zinc-500">
            한 줄에 하나씩:{" "}
            <code className="rounded bg-zinc-100 px-1">영도도끼2 +21</code>
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            placeholder={"영도도끼2 +21\n하락중이에오 +30\n우잉워닝 +31"}
            className={`${inputClassNameSm} w-full resize-y font-mono text-sm`}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleTextParse("replace")}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
            >
              텍스트로 불러오기
            </button>
            {parsePreview && (
              <button
                type="button"
                onClick={() => handleTextParse("append")}
                className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
              >
                이어서 추가
              </button>
            )}
          </div>
        </div>

        {parseError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {parseError}
          </p>
        )}

        {parsePreview && (
          <div className="rounded-xl border border-violet-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-zinc-800">
              인식 결과 — 매칭 확인 후 적용
              {parseMeta && (
                <span className="ml-2 font-normal text-zinc-400">
                  {parseMeta.total}명
                  {parseMeta.images > 1 && ` · ${parseMeta.images}장 합침`}
                </span>
              )}
            </p>
            <div className="space-y-2">
              {parsePreview.map((row, i) => (
                <div
                  key={`${row.nickname}-${i}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2"
                >
                  <span className="w-28 shrink-0 truncate text-sm font-medium text-zinc-700">
                    {row.nickname}
                  </span>
                  <span className="text-xs text-zinc-400">{row.scoreRaw}</span>
                  <span className="text-zinc-300">→</span>
                  <SelectField
                    value={row.participantId}
                    onChange={(v) => {
                      setParsePreview((prev) =>
                        prev?.map((r, j) =>
                          j === i ? { ...r, participantId: v } : r,
                        ) ?? null,
                      );
                    }}
                    options={[
                      { value: "", label: "매칭 선택" },
                      ...participants.map((p) => ({
                        value: p.id,
                        label: p.name,
                      })),
                    ]}
                    placeholder="매칭"
                    className="min-w-[120px] flex-1"
                  />
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={row.strokes}
                    onChange={(e) => {
                      const v = e.target.value;
                      setParsePreview((prev) =>
                        prev?.map((r, j) =>
                          j === i ? { ...r, strokes: v } : r,
                        ) ?? null,
                      );
                    }}
                    className={`${inputClassNameSm} w-20`}
                  />
                  <span className="text-xs text-zinc-400">스코어</span>
                  {row.participantId && (
                    <label className="flex items-center gap-1 text-xs text-zinc-500">
                      <input
                        type="checkbox"
                        checked={row.saveMapping}
                        onChange={(e) => {
                          setParsePreview((prev) =>
                            prev?.map((r, j) =>
                              j === i
                                ? { ...r, saveMapping: e.target.checked }
                                : r,
                            ) ?? null,
                          );
                        }}
                      />
                      매핑 저장
                    </label>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={applyPreview}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
              >
                점수 적용
              </button>
              <button
                type="button"
                onClick={() => setParsePreview(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 수동 스코어 */}
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
                placeholder="스코어"
                className={inputClassNameSm}
              />
              <span className="text-sm text-zinc-400">스코어</span>
            </div>
          ))}
        </div>
      </section>

      {/* 정산 */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <Receipt className="h-5 w-5 text-emerald-600" />
          비용 정산
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
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

      {/* 커피 */}
      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <Coffee className="h-5 w-5 text-orange-500" />
          커피 내기
        </h3>
        {data.coffeeBets.length > 0 && (
          <ul className="mb-4 space-y-2">
            {data.coffeeBets.map((bet) => (
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
        onClick={handleSave}
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

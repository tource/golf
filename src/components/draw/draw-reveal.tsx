"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { RoundSummary } from "@/components/round/round-summary";
import { fetchRoundResult } from "@/lib/utils/round-data";
import type {
  AssignmentWithParticipant,
  RoundResultData,
} from "@/lib/types/database";
import { getRoomColor } from "@/lib/utils/constants";
import { shuffle } from "@/lib/utils/shuffle";

type Phase = "loading" | "countdown" | "shuffle" | "reveal" | "done";

const REVEAL_INTERVAL_MS = 1000;
const SHUFFLE_TICK_MS = 120;
const SHUFFLE_TICKS = 18;

interface DrawRevealProps {
  roundId: string;
  skipAnimation?: boolean;
}

export function DrawReveal({
  roundId,
  skipAnimation = false,
}: DrawRevealProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [countdown, setCountdown] = useState(3);
  const [shuffleName, setShuffleName] = useState("");
  const [assignments, setAssignments] = useState<AssignmentWithParticipant[]>(
    [],
  );
  const [revealOrder, setRevealOrder] = useState<AssignmentWithParticipant[]>(
    [],
  );
  const [revealIndex, setRevealIndex] = useState(-1); // 현재 스포트라이트 카드 인덱스
  const [lockedCount, setLockedCount] = useState(0); // 확정된 카드 수
  const [resultData, setResultData] = useState<RoundResultData | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fetchData = useCallback(async () => {
    const result = await fetchRoundResult(roundId);
    if (!result) {
      setPhase("done");
      return;
    }

    setResultData(result);
    setAssignments(result.assignments);

    if (result.assignments.length === 0) {
      setPhase("done");
      return;
    }

    setRevealOrder(shuffle(result.assignments));

    if (skipAnimation) {
      setLockedCount(result.assignments.length);
      setRevealIndex(-1);
      setPhase("done");
    } else {
      setLockedCount(0);
      setRevealIndex(-1);
      setCountdown(3);
      setPhase("countdown");
    }
  }, [roundId, skipAnimation]);

  useEffect(() => {
    fetchData();
    return clearTimer;
  }, [fetchData]);

  // ── 카운트다운 ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("shuffle");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // ── 이름 셔플 ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "shuffle" || revealOrder.length === 0) return;

    const names = revealOrder.map((a) => a.participants.name);
    let ticks = 0;
    setShuffleName(names[0] ?? "");

    timerRef.current = setInterval(() => {
      ticks++;
      setShuffleName(names[Math.floor(Math.random() * names.length)] ?? "");
      if (ticks >= SHUFFLE_TICKS) {
        clearTimer();
        // 짧은 딜레이 후 reveal로 전환 (exit 애니메이션 여유)
        setTimeout(() => {
          setRevealIndex(0);
          setLockedCount(0);
          setPhase("reveal");
        }, 200);
      }
    }, SHUFFLE_TICK_MS);

    return clearTimer;
  }, [phase, revealOrder]);

  // ── 순차 공개 ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "reveal" || revealOrder.length === 0) return;

    const advance = () => {
      setRevealIndex((prev) => {
        const next = prev + 1;
        if (next >= revealOrder.length) {
          // 마지막 카드 공개 완료
          setTimeout(() => {
            setLockedCount(revealOrder.length);
            setRevealIndex(-1);
            setPhase("done");
          }, REVEAL_INTERVAL_MS + 400);
          return prev; // 마지막 카드 유지
        }
        // 이전 카드를 locked로 넘기고 다음 카드 스포트라이트
        setLockedCount(next);
        return next;
      });
    };

    const t = setTimeout(advance, REVEAL_INTERVAL_MS);
    return () => clearTimeout(t);
    // revealIndex가 바뀔 때마다 다음 타이머 예약
  }, [phase, revealIndex, revealOrder]);

  const currentCard =
    phase === "reveal" && revealIndex >= 0 && revealIndex < revealOrder.length
      ? revealOrder[revealIndex]
      : null;

  const lockedAssignments =
    phase === "reveal"
      ? revealOrder.slice(0, lockedCount)
      : phase === "done"
        ? revealOrder
        : [];

  const progress =
    revealOrder.length > 0
      ? Math.min((lockedCount / revealOrder.length) * 100, 100)
      : 0;

  // ── 로딩 / 에러 ─────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!resultData) {
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

  const { round } = resultData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">{round.title}</h1>
          <p className="text-sm text-zinc-500">{round.venues.name}</p>
        </div>

        {/* ── 카운트다운 ── */}
        <AnimatePresence mode="wait">
          {phase === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="flex min-h-[320px] flex-col items-center justify-center"
            >
              <p className="mb-6 flex items-center gap-2 text-lg font-medium text-emerald-700">
                <Sparkles className="h-5 w-5" />
                추첨을 시작합니다!
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={countdown}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{
                    scale: 1.4,
                    opacity: 0,
                    transition: { duration: 0.25 },
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="text-9xl font-black tabular-nums text-emerald-600"
                >
                  {countdown}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── 셔플 ── */}
          {phase === "shuffle" && (
            <motion.div
              key="shuffle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex min-h-[320px] flex-col items-center justify-center"
            >
              <p className="mb-2 text-sm font-medium tracking-wide text-zinc-400 uppercase">
                이름 섞는 중
              </p>
              <p className="mb-8 text-xs text-zinc-400">
                잠시 후 순서대로 방이 배정됩니다
              </p>
              <div className="relative flex h-28 items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "linear",
                  }}
                  className="absolute h-32 w-32 rounded-full border-2 border-dashed border-emerald-300"
                />
                {/* key를 shuffleName으로 쓰면 같은 이름 연속 시 애니메이션 안 됨 → tick 카운터 사용 */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={shuffleName + Math.random()} // 매 tick 고유 key
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.07 }}
                    className="relative text-3xl font-black text-emerald-700 sm:text-4xl"
                  >
                    {shuffleName}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── 공개 ── */}
          {phase === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[420px]"
            >
              {/* 프로그레스 바 */}
              <div className="mb-8">
                <div className="mb-2 flex justify-between text-xs font-medium text-zinc-500">
                  <span>방 배정 중</span>
                  <span>
                    {lockedCount} / {revealOrder.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* 스포트라이트 카드 */}
              <div className="flex min-h-[240px] items-center justify-center">
                <AnimatePresence mode="wait">
                  {currentCard && (
                    <motion.div
                      key={currentCard.id}
                      initial={{ opacity: 0, scale: 0.85, y: -40 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 24 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 26,
                      }}
                      className="w-full max-w-sm"
                    >
                      {(() => {
                        const color = getRoomColor(currentCard.room_number);
                        return (
                          <div
                            className={`rounded-3xl border-2 p-8 text-center shadow-xl ${color.light} ${color.border}`}
                          >
                            <div
                              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md ${color.bg}`}
                            >
                              {currentCard.room_number}
                            </div>
                            <p className="text-3xl font-black text-zinc-900 sm:text-4xl">
                              {currentCard.participants.name}
                            </p>
                            <p
                              className={`mt-3 text-lg font-bold ${color.text}`}
                            >
                              {currentCard.room_number}번 방 배정!
                            </p>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 확정된 칩 목록 */}
              {lockedAssignments.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <AnimatePresence initial={false}>
                    {lockedAssignments.map((a) => {
                      const color = getRoomColor(a.room_number);
                      return (
                        <motion.span
                          key={a.id}
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 24,
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${color.light} ${color.border} ${color.text}`}
                        >
                          {a.participants.name} · {a.room_number}번
                        </motion.span>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ── 완료 ── */}
          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {assignments.length === 0 ? (
                <p className="text-center text-zinc-600">
                  아직 추첨 결과가 없습니다.
                </p>
              ) : (
                <>
                  <div className="mb-6 rounded-2xl bg-emerald-600 px-6 py-4 text-center text-white shadow-lg">
                    <p className="text-lg font-bold">추첨 완료!</p>
                    <p className="text-sm text-emerald-100">
                      총 {assignments.length}명 배정
                    </p>
                  </div>
                  <div className="mb-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                    <RoundSummary data={resultData} showLink={false} />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                      href={`/round/${roundId}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      점수·정산 입력
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/"
                      className="flex items-center justify-center rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      홈으로
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

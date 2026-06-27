"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { RoundSummary } from "@/components/round/round-summary";
import { fetchRoundResult } from "@/lib/utils/round-data";
import type { AssignmentWithParticipant, RoundResultData } from "@/lib/types/database";
import { getRoomColor } from "@/lib/utils/constants";
import { shuffle } from "@/lib/utils/shuffle";

type Phase = "loading" | "countdown" | "shuffle" | "reveal" | "done";

interface DrawRevealProps {
  roundId: string;
  skipAnimation?: boolean;
}

export function DrawReveal({ roundId, skipAnimation = false }: DrawRevealProps) {
  const [phase, setPhase] = useState<Phase>(skipAnimation ? "loading" : "loading");
  const [countdown, setCountdown] = useState(3);
  const [shuffleName, setShuffleName] = useState("");
  const [assignments, setAssignments] = useState<AssignmentWithParticipant[]>([]);
  const [revealOrder, setRevealOrder] = useState<AssignmentWithParticipant[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [currentReveal, setCurrentReveal] = useState<AssignmentWithParticipant | null>(null);
  const [resultData, setResultData] = useState<RoundResultData | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const result = await fetchRoundResult(roundId);
    if (!result) {
      setPhase("done");
      return;
    }

    setResultData(result);
    setAssignments(result.assignments);

    if (result.assignments.length > 0) {
      const order = shuffle(result.assignments);
      setRevealOrder(order);
      if (skipAnimation) {
        setRevealedCount(order.length);
        setPhase("done");
      } else {
        setPhase("countdown");
      }
    } else {
      setPhase("done");
    }
  }, [roundId, skipAnimation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3, 2, 1 카운트다운
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("shuffle");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // 이름 빠르게 섞기
  useEffect(() => {
    if (phase !== "shuffle") return;
    const names = assignments.map((a) => a.participants.name);
    let ticks = 0;
    const interval = setInterval(() => {
      setShuffleName(names[Math.floor(Math.random() * names.length)] ?? "");
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        setPhase("reveal");
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase, assignments]);

  // 1명씩 방 배정 공개
  useEffect(() => {
    if (phase !== "reveal") return;
    if (revealedCount >= revealOrder.length) {
      const t = setTimeout(() => setPhase("done"), 800);
      return () => clearTimeout(t);
    }

    const person = revealOrder[revealedCount];
    setCurrentReveal(person);

    const t = setTimeout(() => {
      setRevealedCount((c) => c + 1);
      setCurrentReveal(null);
    }, 900);

    return () => clearTimeout(t);
  }, [phase, revealedCount, revealOrder]);

  const revealedAssignments = useMemo(
    () => revealOrder.slice(0, revealedCount),
    [revealOrder, revealedCount],
  );

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

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">{round.title}</h1>
          <p className="text-sm text-zinc-500">{round.venues.name}</p>
        </div>

        <AnimatePresence mode="wait">
          {phase === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="flex min-h-[280px] flex-col items-center justify-center"
            >
              <p className="mb-4 text-lg font-medium text-emerald-700">
                추첨을 시작합니다!
              </p>
              <motion.p
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-9xl font-black text-emerald-600"
              >
                {countdown}
              </motion.p>
            </motion.div>
          )}

          {phase === "shuffle" && (
            <motion.div
              key="shuffle"
              className="flex min-h-[280px] flex-col items-center justify-center"
            >
              <p className="mb-4 text-sm text-zinc-500">섞는 중...</p>
              <motion.p
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="text-4xl font-black text-emerald-700"
              >
                {shuffleName}
              </motion.p>
            </motion.div>
          )}

          {phase === "reveal" && (
            <motion.div
              key="reveal-active"
              className="flex min-h-[280px] flex-col items-center justify-center"
            >
              {currentReveal ? (
                <motion.div
                  key={currentReveal.id}
                  initial={{ y: -60, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="text-center"
                >
                  <p className="mb-2 text-3xl font-black text-zinc-900 sm:text-4xl">
                    {currentReveal.participants.name}
                  </p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring" }}
                    className={`inline-block rounded-full px-6 py-2 text-xl font-bold text-white ${getRoomColor(currentReveal.room_number).bg}`}
                  >
                    → {currentReveal.room_number}번 방
                  </motion.p>
                </motion.div>
              ) : (
                <p className="text-sm text-zinc-400">
                  {revealedCount} / {revealOrder.length}
                </p>
              )}

              {/* 이미 공개된 명단 */}
              {revealedAssignments.length > 0 && (
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {revealedAssignments.map((a) => {
                    const color = getRoomColor(a.room_number);
                    return (
                      <span
                        key={a.id}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${color.light} ${color.text}`}
                      >
                        {a.participants.name} · {a.room_number}번
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {assignments.length === 0 ? (
                <p className="text-center text-zinc-600">
                  아직 추첨 결과가 없습니다.
                </p>
              ) : (
                <>
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

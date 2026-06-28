"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/ui/header";
import { NameSelect } from "@/components/ui/name-select";
import { inputClassName } from "@/components/ui/input-styles";
import { Skeleton } from "@/components/ui/skeleton";
import { DuplicateModal } from "@/components/participate/duplicate-modal";
import { ParticipantList } from "@/components/participate/participant-list";
import { VenueInfo } from "@/components/ui/venue-info";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { MyRoomCard } from "@/components/ui/my-room-card";
import type { Participant, RoundWithVenue } from "@/lib/types/database";
import {
  getSavedMemberName,
  saveMemberName,
} from "@/lib/utils/member-name";

interface ParticipateFormProps {
  roundId: string;
}

export function ParticipateForm({ roundId }: ParticipateFormProps) {
  const [round, setRound] = useState<RoundWithVenue | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [isAttending, setIsAttending] = useState(true);
  const [comment, setComment] = useState("");
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [assignmentCount, setAssignmentCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const saved = getSavedMemberName();
    if (saved) setName(saved);
  }, []);

  // 라운드 정보 + 참여자 목록을 Supabase에서 불러옵니다.
  const fetchData = useCallback(async () => {
    const [{ data: roundData }, { data: participantData }, { count }] =
      await Promise.all([
        supabase.from("rounds").select("*, venues(*)").eq("id", roundId).single(),
        supabase
          .from("participants")
          .select("*")
          .eq("round_id", roundId)
          .order("created_at", { ascending: true }),
        supabase
          .from("room_assignments")
          .select("*", { count: "exact", head: true })
          .eq("round_id", roundId),
      ]);

    if (roundData) setRound(roundData as RoundWithVenue);
    if (participantData) setParticipants(participantData as Participant[]);
    setAssignmentCount(count ?? 0);
    setLoading(false);
  }, [roundId, supabase]);

  useEffect(() => {
    fetchData();

    // Realtime: 다른 참가자의 신청이 들어오면 목록을 자동 갱신합니다.
    const channel = supabase
      .channel(`participants-${roundId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `round_id=eq.${roundId}`,
        },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roundId, fetchData, supabase]);

  async function saveParticipant(overwriteId?: string) {
    setSubmitting(true);
    const payload = {
      round_id: roundId,
      name: name.trim(),
      is_attending: isAttending,
      comment: comment.trim() || null,
    };

    if (overwriteId) {
      await supabase.from("participants").update(payload).eq("id", overwriteId);
    } else {
      await supabase.from("participants").insert(payload);
    }

    setSubmitted(true);
    setShowDuplicate(false);
    saveMemberName(name.trim());
    setSubmitting(false);
    fetchData();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    // 동일 이름 중복 체크
    const existing = participants.find(
      (p) => p.name.trim() === name.trim(),
    );

    if (existing) {
      setExistingId(existing.id);
      setShowDuplicate(true);
      return;
    }

    await saveParticipant();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-zinc-600">라운드를 찾을 수 없습니다.</p>
          <Link href="/" className="mt-4 inline-block text-emerald-700">
            홈으로
          </Link>
        </main>
      </div>
    );
  }

  if (round.status !== "open") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>

          <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-bold text-zinc-900">{round.title}</p>
            <p className="mt-2 text-sm text-zinc-500">
              이 라운드는 신청이 마감되었습니다.
            </p>
            <div className="mt-4 flex justify-center">
              <VenueInfo venue={round.venues} compact />
            </div>
          </div>

          {assignmentCount > 0 && (
            <div className="mb-6">
              <MyRoomCard roundId={round.id} assignmentCount={assignmentCount} />
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <Link
              href={`/round/${round.id}`}
              className="w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white"
            >
              라운드 결과 보기
            </Link>
            {assignmentCount > 0 && (
              <Link
                href={`/draw/${round.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-200 px-6 py-3 text-sm font-semibold text-emerald-700"
              >
                <Sparkles className="h-4 w-4" />
                추첨 애니메이션 보기
              </Link>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-900"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">{round.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {new Date(round.date).toLocaleString("ko-KR")}
          </p>
          <div className="mt-3">
            <VenueInfo venue={round.venues} compact />
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <CopyLinkButton
            path={`/participate?round=${roundId}`}
            label="참여 링크 복사"
          />
          {assignmentCount > 0 && (
            <Link
              href={`/draw/${roundId}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <Sparkles className="h-4 w-4" />
              추첨 보기
            </Link>
          )}
        </div>

        {assignmentCount > 0 && (
          <div className="mb-6">
            <MyRoomCard roundId={roundId} assignmentCount={assignmentCount} />
          </div>
        )}

        {submitted && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-800">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {name.trim()}님,{" "}
              {isAttending ? "참여" : "불참"}로 등록되었습니다!
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              이름
            </label>
            <NameSelect
              value={name}
              onChange={(v) => {
                setName(v);
                saveMemberName(v);
              }}
              placeholder="이름 선택"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              참여 여부
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsAttending(true)}
                className={`flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition ${
                  isAttending
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                <ThumbsUp className="h-5 w-5" />
                참여
              </button>
              <button
                type="button"
                onClick={() => setIsAttending(false)}
                className={`flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition ${
                  !isAttending
                    ? "bg-zinc-600 text-white shadow-md"
                    : "border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                <ThumbsDown className="h-5 w-5" />
                불참
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              한마디{" "}
              <span className="font-normal text-zinc-400">(선택, 20자 이내)</span>
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 20))}
              placeholder="오늘도 버디 도전!"
              maxLength={20}
              className={inputClassName}
            />
            <p className="mt-1 text-right text-xs text-zinc-500">
              {comment.length}/20
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "제출 중..." : "신청하기"}
          </button>
        </form>

        <div>
          <h2 className="mb-4 text-lg font-bold text-zinc-900">
            현재 신청 현황
            <span className="ml-2 text-sm font-normal text-emerald-600">
              실시간 업데이트
            </span>
          </h2>
          <ParticipantList participants={participants} />
        </div>
      </main>

      {showDuplicate && (
        <DuplicateModal
          name={name}
          onConfirm={() => existingId && saveParticipant(existingId)}
          onCancel={() => setShowDuplicate(false)}
        />
      )}
    </div>
  );
}

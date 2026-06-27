"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Dices, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { assignRooms } from "@/lib/utils/draw";
import { SelectField } from "@/components/ui/select-field";
import type { Participant, Round, RoomAssignment } from "@/lib/types/database";

interface RoomAssignmentManagerProps {
  round: Round;
  onUpdated?: () => void;
}

export function RoomAssignmentManager({
  round,
  onUpdated,
}: RoomAssignmentManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [roomMap, setRoomMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const attending = participants.filter((p) => p.is_attending);
  const canEdit = round.status !== "open";

  const fetchData = useCallback(async () => {
    const [{ data: pData }, { data: aData }] = await Promise.all([
      supabase
        .from("participants")
        .select("*")
        .eq("round_id", round.id)
        .eq("is_attending", true)
        .order("name"),
      supabase
        .from("room_assignments")
        .select("*")
        .eq("round_id", round.id),
    ]);

    if (pData) setParticipants(pData as Participant[]);
    if (aData) {
      setAssignments(aData as RoomAssignment[]);
      const map: Record<string, string> = {};
      (aData as RoomAssignment[]).forEach((a) => {
        map[a.participant_id] = String(a.room_number);
      });
      setRoomMap(map);
    }
  }, [round.id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const roomOptions = [
    { value: "", label: "미배정" },
    ...Array.from({ length: round.room_count }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}번 방`,
    })),
  ];

  async function saveAssignments(map: Record<string, string>) {
    setSaving(true);
    await supabase
      .from("room_assignments")
      .delete()
      .eq("round_id", round.id);

    const inserts = Object.entries(map)
      .filter(([, room]) => room !== "")
      .map(([participant_id, room]) => ({
        round_id: round.id,
        participant_id,
        room_number: parseInt(room),
      }));

    if (inserts.length > 0) {
      await supabase.from("room_assignments").insert(inserts);
    }

    setSaving(false);
    setMessage("방 배정이 저장되었습니다.");
    fetchData();
    onUpdated?.();
  }

  async function handleManualSave() {
    await saveAssignments(roomMap);
  }

  async function handleAutoDraw(goAnimation = false) {
    if (attending.length === 0) return;
    setSaving(true);

    const results = assignRooms(
      attending,
      round.room_count,
      round.players_per_room,
    );

    const map: Record<string, string> = {};
    results.forEach((r) => {
      map[r.participant_id] = String(r.room_number);
    });

    await saveAssignments(map);
    setSaving(false);

    if (goAnimation) {
      window.location.href = `/draw/${round.id}`;
    }
  }

  async function handleClear() {
    if (!confirm("방 배정을 모두 초기화할까요?")) return;
    setRoomMap({});
    await saveAssignments({});
    setMessage("방 배정이 초기화되었습니다.");
  }

  if (!canEdit) {
    return (
      <p className="text-sm text-zinc-500">
        신청 마감 후 방 배정을 할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        방 배정은 선택 사항입니다. 자동 추첨하거나 직접 지정할 수 있으며 언제든
        변경할 수 있습니다.
      </p>

      {attending.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-400">
          참여자가 없습니다.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAutoDraw(false)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Dices className="h-4 w-4" />
              자동 추첨
            </button>
            <button
              type="button"
              disabled={saving || assignments.length === 0}
              onClick={() => handleAutoDraw(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
            >
              추첨 + 애니메이션
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              초기화
            </button>
            {assignments.length > 0 && (
              <Link
                href={`/draw/${round.id}?skip=1`}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                배정 결과 보기
              </Link>
            )}
          </div>

          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
            {attending.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-24 shrink-0 text-sm font-medium text-zinc-900">
                  {p.name}
                </span>
                <SelectField
                  value={roomMap[p.id] ?? ""}
                  onChange={(v) =>
                    setRoomMap((prev) => ({ ...prev, [p.id]: v }))
                  }
                  options={roomOptions}
                  placeholder="미배정"
                  className="flex-1"
                />
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={saving}
            onClick={handleManualSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "저장 중..." : "수동 배정 저장"}
          </button>
        </>
      )}

      {message && (
        <p className="text-center text-sm font-medium text-emerald-700">
          {message}
        </p>
      )}
    </div>
  );
}

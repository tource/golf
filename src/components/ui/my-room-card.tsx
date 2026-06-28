"use client";

import { useCallback, useEffect, useState } from "react";
import { DoorOpen, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NameSelect } from "@/components/ui/name-select";
import { getRoomColor } from "@/lib/utils/constants";
import {
  getSavedMemberName,
  saveMemberName,
} from "@/lib/utils/member-name";

interface MyRoomCardProps {
  roundId: string;
  assignmentCount: number;
}

export function MyRoomCard({ roundId, assignmentCount }: MyRoomCardProps) {
  const [name, setName] = useState("");
  const [roomNumber, setRoomNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setName(getSavedMemberName());
  }, []);

  const lookupRoom = useCallback(
    async (memberName: string) => {
      if (!memberName.trim() || assignmentCount === 0) {
        setRoomNumber(null);
        setChecked(true);
        return;
      }

      setLoading(true);
      const supabase = createClient();

      const { data: participant } = await supabase
        .from("participants")
        .select("id")
        .eq("round_id", roundId)
        .eq("name", memberName.trim())
        .eq("is_attending", true)
        .maybeSingle();

      if (!participant) {
        setRoomNumber(null);
        setChecked(true);
        setLoading(false);
        return;
      }

      const { data: assignment } = await supabase
        .from("room_assignments")
        .select("room_number")
        .eq("round_id", roundId)
        .eq("participant_id", participant.id)
        .maybeSingle();

      setRoomNumber(assignment?.room_number ?? null);
      setChecked(true);
      setLoading(false);
    },
    [roundId, assignmentCount],
  );

  useEffect(() => {
    const saved = getSavedMemberName();
    if (saved) lookupRoom(saved);
  }, [lookupRoom]);

  function handleNameChange(value: string) {
    setName(value);
    saveMemberName(value);
    setChecked(false);
    if (value.trim()) lookupRoom(value);
  }

  if (assignmentCount === 0) return null;

  const color = roomNumber != null ? getRoomColor(roomNumber) : null;

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 p-5">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-emerald-800">
        <DoorOpen className="h-4 w-4" />
        내 방 확인
      </p>

      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-500">
          <User className="h-3 w-3" />
          이름
        </label>
        <NameSelect
          value={name}
          onChange={handleNameChange}
          placeholder="이름 선택"
        />
      </div>

      {loading && (
        <p className="text-center text-sm text-zinc-400">조회 중...</p>
      )}

      {!loading && checked && name.trim() && roomNumber != null && color && (
        <div
          className={`rounded-xl border-2 px-4 py-3 text-center ${color.light} ${color.border}`}
        >
          <p className="text-lg font-black text-zinc-900">{name.trim()}</p>
          <p className={`mt-1 text-2xl font-black ${color.text}`}>
            {roomNumber}번 방
          </p>
        </div>
      )}

      {!loading && checked && name.trim() && roomNumber == null && (
        <p className="rounded-xl bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-500">
          배정 정보를 찾을 수 없어요. 이름을 확인해 주세요.
        </p>
      )}
    </div>
  );
}

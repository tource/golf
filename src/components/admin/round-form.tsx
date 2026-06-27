"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputClassNameSm, selectClassName } from "@/components/ui/input-styles";
import type { Round, Venue } from "@/lib/types/database";

interface RoundFormProps {
  onCreated: () => void;
}

export function RoundForm({ onCreated }: RoundFormProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venueId, setVenueId] = useState("");
  const [roomCount, setRoomCount] = useState(3);
  const [playersPerRoom, setPlayersPerRoom] = useState(4);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("venues")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setVenues(data as Venue[]);
          if (data[0]) setVenueId(data[0].id);
        }
      });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date || !venueId) return;

    await supabase.from("rounds").insert({
      title: title.trim(),
      date: new Date(date).toISOString(),
      venue_id: venueId,
      room_count: roomCount,
      players_per_room: playersPerRoom,
      status: "open",
    });

    setTitle("");
    setDate("");
    onCreated();
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-bold text-zinc-900">라운드 등록</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            라운드 이름
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="6월 정기 라운드"
            required
            className={inputClassNameSm}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            날짜 및 시간
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClassNameSm}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            매장
          </label>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            required
            className={selectClassName}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            방 개수 (1~10)
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={roomCount}
            onChange={(e) => setRoomCount(parseInt(e.target.value))}
            className={inputClassNameSm}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            방당 최대 인원 (2~6)
          </label>
          <input
            type="number"
            min={2}
            max={6}
            value={playersPerRoom}
            onChange={(e) => setPlayersPerRoom(parseInt(e.target.value))}
            className={inputClassNameSm}
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            라운드 등록
          </button>
        </div>
      </form>
    </section>
  );
}

export function RoundSelector({
  rounds,
  selectedId,
  onSelect,
}: {
  rounds: Round[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className={selectClassName}
    >
      {rounds.map((r) => (
        <option key={r.id} value={r.id}>
          {r.title} ({r.status}) —{" "}
          {new Date(r.date).toLocaleDateString("ko-KR")}
        </option>
      ))}
    </select>
  );
}

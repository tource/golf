"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputClassNameSm } from "@/components/ui/input-styles";
import type { Venue } from "@/lib/types/database";

export function VenueManager() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchVenues = useCallback(async () => {
    const { data } = await supabase.from("venues").select("*").order("name");
    if (data) setVenues(data as Venue[]);
  }, [supabase]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  function resetForm() {
    setName("");
    setAddress("");
    setPrice("");
    setNotes("");
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      address: address.trim() || null,
      price_per_hour: price ? parseInt(price) : null,
      notes: notes.trim() || null,
    };

    if (editingId) {
      await supabase.from("venues").update(payload).eq("id", editingId);
    } else {
      await supabase.from("venues").insert(payload);
    }
    resetForm();
    fetchVenues();
  }

  function startEdit(venue: Venue) {
    setEditingId(venue.id);
    setName(venue.name);
    setAddress(venue.address ?? "");
    setPrice(venue.price_per_hour?.toString() ?? "");
    setNotes(venue.notes ?? "");
  }

  async function handleDelete(id: string) {
    if (!confirm("이 매장을 삭제할까요?")) return;
    await supabase.from("venues").delete().eq("id", id);
    fetchVenues();
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-bold text-zinc-900">매장 관리</h2>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="매장명 *"
          required
          className={inputClassNameSm}
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="주소"
          className={inputClassNameSm}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="시간당 가격 (원)"
          type="number"
          className={inputClassNameSm}
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="메모"
          className={inputClassNameSm}
        />
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? "수정" : "추가"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm text-zinc-600"
            >
              취소
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-2">
        {venues.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
          >
            <div>
              <p className="font-semibold text-zinc-900">{v.name}</p>
              <p className="text-xs text-zinc-500">
                {[v.address, v.price_per_hour && `${v.price_per_hour.toLocaleString()}원/h`, v.notes]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(v)} className="rounded-lg p-2 text-zinc-400 hover:text-emerald-700">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(v.id)} className="rounded-lg p-2 text-zinc-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

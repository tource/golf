"use client";

import { RoundSelector } from "@/components/admin/round-form";
import type { Round } from "@/lib/types/database";

interface AdminRoundBarProps {
  rounds: Round[];
  selectedId: string;
  onSelect: (id: string) => void;
  title?: string;
  description?: string;
}

export function AdminRoundBar({
  rounds,
  selectedId,
  onSelect,
  title,
  description,
}: AdminRoundBarProps) {
  const selected = rounds.find((r) => r.id === selectedId);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
        </div>
      )}
      <RoundSelector
        rounds={rounds}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      {selected && (
        <p className="mt-3 text-xs text-zinc-400">
          {selected.date} ·{" "}
          <span
            className={
              selected.status === "open"
                ? "text-emerald-600"
                : selected.status === "completed"
                  ? "text-violet-600"
                  : "text-amber-600"
            }
          >
            {selected.status === "open"
              ? "모집 중"
              : selected.status === "closed"
                ? "마감"
                : "완료"}
          </span>
        </p>
      )}
    </div>
  );
}

"use client";

import type { Participant } from "@/lib/types/database";

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  const attending = participants.filter((p) => p.is_attending);
  const absent = participants.filter((p) => !p.is_attending);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-emerald-50 p-5">
        <h3 className="mb-3 text-sm font-bold text-emerald-800">
          참여 ({attending.length}명)
        </h3>
        {attending.length === 0 ? (
          <p className="text-sm text-zinc-400">아직 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {attending.map((p) => (
              <li
                key={p.id}
                className="rounded-xl bg-white px-4 py-3 shadow-sm"
              >
                <p className="font-semibold text-zinc-900">{p.name}</p>
                {p.comment && (
                  <p className="mt-0.5 text-xs text-emerald-600">
                    &ldquo;{p.comment}&rdquo;
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-zinc-50 p-5">
        <h3 className="mb-3 text-sm font-bold text-zinc-600">
          불참 ({absent.length}명)
        </h3>
        {absent.length === 0 ? (
          <p className="text-sm text-zinc-400">아직 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {absent.map((p) => (
              <li
                key={p.id}
                className="rounded-xl bg-white px-4 py-3 shadow-sm"
              >
                <p className="font-medium text-zinc-700">{p.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

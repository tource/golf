"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [dDay, setDDay] = useState(0);
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function tick() {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target.getTime() - now.getTime();

      const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

      setDDay(days);
      setParts({ days, hours, minutes, seconds });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (dDay > 0) {
    return (
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
          D-Day
        </p>
        <p className="mt-2 text-8xl font-black tabular-nums text-emerald-700 sm:text-9xl">
          D-{dDay}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
        라운드까지
      </p>
      <div className="mt-4 flex justify-center gap-3 sm:gap-6">
        {[
          { label: "시", value: parts.hours },
          { label: "분", value: parts.minutes },
          { label: "초", value: parts.seconds },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-4xl font-black tabular-nums text-emerald-700 sm:text-6xl">
              {String(value).padStart(2, "0")}
            </p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

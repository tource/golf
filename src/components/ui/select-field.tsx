"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = "선택하세요",
  className = "",
  disabled = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-left text-sm transition ${
          open
            ? "border-emerald-500 ring-2 ring-emerald-100"
            : "border-zinc-300 hover:border-zinc-400"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span className={selected ? "font-medium text-zinc-900" : "text-zinc-500"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg shadow-zinc-200/60">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-emerald-50 ${
                  value === opt.value
                    ? "bg-emerald-50 font-semibold text-emerald-800"
                    : "text-zinc-800"
                }`}
              >
                {opt.label}
                {value === opt.value && (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

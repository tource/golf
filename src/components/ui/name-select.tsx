"use client";

import { useState } from "react";
import { useMemberNames } from "@/hooks/use-member-names";
import { SelectField } from "@/components/ui/select-field";
import { inputClassName } from "@/components/ui/input-styles";

const CUSTOM = "__custom__";

interface NameSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function NameSelect({
  value,
  onChange,
  placeholder = "이름 선택",
  required,
}: NameSelectProps) {
  const { names } = useMemberNames();
  const isCustom = value !== "" && !names.includes(value);
  const [mode, setMode] = useState<"select" | "custom">(
    isCustom || names.length === 0 ? "custom" : "select",
  );

  const selectValue =
    mode === "custom" ? CUSTOM : value || "";

  const options = [
    ...names.map((n) => ({ value: n, label: n })),
    { value: CUSTOM, label: "✏️ 직접 입력" },
  ];

  return (
    <div className="space-y-2">
      {names.length > 0 && (
        <SelectField
          value={selectValue}
          onChange={(v) => {
            if (v === CUSTOM) {
              setMode("custom");
              onChange("");
            } else {
              setMode("select");
              onChange(v);
            }
          }}
          options={options}
          placeholder={placeholder}
        />
      )}

      {(mode === "custom" || names.length === 0) && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="이름을 입력하세요"
          required={required}
          className={inputClassName}
        />
      )}

      {names.length > 0 && mode === "custom" && (
        <button
          type="button"
          onClick={() => {
            setMode("select");
            onChange("");
          }}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
        >
          ← 목록에서 선택
        </button>
      )}
    </div>
  );
}

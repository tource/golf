"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

interface CopyLinkButtonProps {
  path: string;
  label?: string;
  className?: string;
}

export function CopyLinkButton({
  path,
  label = "링크 복사",
  className = "",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 실패 시 무시
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          복사됨!
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}

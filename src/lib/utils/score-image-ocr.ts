"use client";

import type { ParsedScoreEntry } from "@/lib/utils/score-image-parse";
import { mergeScoreEntries } from "@/lib/utils/score-image-parse";
import { preprocessScoreScreenshot } from "@/lib/utils/score-image-preprocess";
import { parseScoreTextSmart } from "@/lib/utils/score-text-parse";

export async function ocrImagesToEntries(
  files: File[],
  knownNicknames: string[],
  onProgress?: (message: string, percent: number) => void,
): Promise<ParsedScoreEntry[]> {
  const { createWorker, PSM } = await import("tesseract.js");
  const batches: ParsedScoreEntry[][] = [];

  const worker = await createWorker("kor", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress("텍스트 인식 중...", Math.round((m.progress ?? 0) * 90));
      }
    },
  });

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: "1",
  });

  try {
    for (let i = 0; i < files.length; i++) {
      onProgress?.(
        `이미지 ${i + 1}/${files.length} 전처리 중...`,
        (i / files.length) * 15,
      );

      const preprocessed = await preprocessScoreScreenshot(files[i]);

      onProgress?.(
        `이미지 ${i + 1}/${files.length} OCR 중...`,
        15 + (i / files.length) * 75,
      );

      const { data } = await worker.recognize(preprocessed);
      const entries = parseScoreTextSmart(data.text, knownNicknames);
      if (entries.length > 0) batches.push(entries);
    }
  } finally {
    await worker.terminate();
  }

  onProgress?.("완료", 100);
  return mergeScoreEntries(batches);
}

export async function parseImagesWithGemini(
  files: File[],
): Promise<ParsedScoreEntry[]> {
  const form = new FormData();
  for (const f of files) form.append("images", f);

  const res = await fetch("/api/admin/parse-scores", {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "AI 분석 실패");
  return json.entries ?? [];
}

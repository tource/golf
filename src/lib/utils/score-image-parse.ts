export interface ParsedScoreEntry {
  nickname: string;
  scoreRaw: string;
  relativeToPar: number | null;
  absoluteScore: number | null;
}

export interface ParsedScoreboard {
  tab: string | null;
  entries: ParsedScoreEntry[];
}

const PARSE_PROMPT = `이 이미지는 스크린골프 앱의 라운드 결과 화면입니다.
현재 활성화된 "스트로크" 탭의 순위표 데이터를 추출해 주세요.

추출 규칙:
1. 닉네임: 각 행의 좌측에 있는 플레이어 이름 (메달이나 순위 숫자는 제외)
2. scoreRaw: 우측에 표시된 스코어 텍스트 전체 (예: "+21", "+30", "0", "-2")
3. relativeToPar: 오버파/언더파 수치를 정수로 변환 (+21 -> 21, -2 -> -2, 이븐/0 -> 0)
4. 화면에 일부만 보여도 보이는 플레이어는 모두 추출 (잘린 스크린샷 가능)
5. 화면 아래로 내려가는 순서대로 모든 플레이어를 배열에 담아 주세요`;

/** 2026-06-01 종료된 구형 모델 → 무료 티어에서 동작하는 후속 모델 */
const DEPRECATED_MODEL_ALIASES: Record<string, string> = {
  "gemini-1.5-flash": "gemini-2.5-flash-lite",
  "gemini-1.5-flash-latest": "gemini-2.5-flash-lite",
  "gemini-1.5-flash-002": "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite": "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite-001": "gemini-2.5-flash-lite",
  "gemini-2.0-flash": "gemini-2.5-flash-lite",
  "gemini-2.0-flash-001": "gemini-2.5-flash-lite",
};

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
] as const;

function resolveGeminiModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  const primary = configured
    ? (DEPRECATED_MODEL_ALIASES[configured] ?? configured)
    : DEFAULT_GEMINI_MODEL;
  return [...new Set([primary, ...GEMINI_MODEL_FALLBACKS])];
}

function formatGeminiError(status: number, body: string, model: string): string {
  if (status === 404) {
    return `모델 '${model}'을(를) 찾을 수 없습니다. gemini-1.5/2.0 계열은 2026년 6월에 종료되었습니다. .env.local의 GEMINI_MODEL을 gemini-2.5-flash-lite 로 바꿔 주세요.`;
  }
  if (status === 429) {
    if (model.startsWith("gemini-2.0") || model.startsWith("gemini-1.5")) {
      return `모델 '${model}'은(는) 종료되어 할당량이 없습니다. GEMINI_MODEL=gemini-2.5-flash-lite 로 변경하거나 OCR 분석을 사용해 주세요.`;
    }
    return `Gemini 할당량 초과(429). 잠시 후 다시 시도하거나 OCR 분석·텍스트 붙여넣기를 사용해 주세요. (${body.slice(0, 120)})`;
  }
  return `이미지 분석 실패 (${model}): ${body.slice(0, 300)}`;
}

function normalizeNickname(n: string) {
  return n.trim().toLowerCase().replace(/\s+/g, "");
}

function parseRelative(raw: string): number | null {
  const t = raw.trim();
  const m = t.match(/^([+-])?\s*(\d+)/);
  if (!m) return null;
  const n = parseInt(m[2], 10);
  if (m[1] === "-") return -n;
  if (m[1] === "+") return n;
  return null;
}

function normalizeEntries(
  raw: { tab?: string; entries?: unknown[] },
): ParsedScoreboard {
  const entries: ParsedScoreEntry[] = [];
  for (const item of raw.entries ?? []) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const nickname = String(o.nickname ?? "").trim();
    const scoreRaw = String(o.scoreRaw ?? o.score ?? "").trim();
    if (!nickname || !scoreRaw) continue;

    const relativeToPar: number | null =
      typeof o.relativeToPar === "number"
        ? o.relativeToPar
        : parseRelative(scoreRaw);

    const abs =
      typeof o.absoluteScore === "number"
        ? o.absoluteScore
        : relativeToPar == null
          ? parseInt(scoreRaw.replace(/\D/g, ""), 10) || null
          : null;

    entries.push({ nickname, scoreRaw, relativeToPar, absoluteScore: abs });
  }
  return { tab: raw.tab ?? null, entries };
}

/** 캡처 스코어(+21 등) → 입력 필드 값. par 변환 없음 */
export function parsedScoreToInput(entry: ParsedScoreEntry): number | null {
  if (entry.relativeToPar != null) return entry.relativeToPar;
  if (entry.absoluteScore != null) return entry.absoluteScore;
  return parseRelative(entry.scoreRaw);
}

/** 여러 이미지 결과 합치기 — 닉네임 중복 시 먼저 나온 항목 유지 */
export function mergeScoreEntries(
  batches: ParsedScoreEntry[][],
): ParsedScoreEntry[] {
  const result: ParsedScoreEntry[] = [];
  const seen = new Set<string>();

  for (const batch of batches) {
    for (const entry of batch) {
      const key = normalizeNickname(entry.nickname);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(entry);
    }
  }
  return result;
}

function parseGeminiJson(text: string): { tab?: string; entries?: unknown[] } {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

async function callGemini(
  model: string,
  base64: string,
  mimeType: string,
): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY가 설정되지 않았습니다. Google AI Studio(aistudio.google.com/apikey)에서 무료 키를 발급해 .env.local에 추가하세요.",
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PARSE_PROMPT },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            tab: { type: "STRING" },
            entries: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  nickname: { type: "STRING" },
                  scoreRaw: { type: "STRING" },
                  relativeToPar: { type: "NUMBER" },
                },
                required: ["nickname", "scoreRaw"],
              },
            },
          },
          required: ["entries"],
        },
        temperature: 0.1,
      },
    }),
  });
}

async function parseWithGemini(
  base64: string,
  mimeType: string,
): Promise<ParsedScoreboard> {
  const models = resolveGeminiModelCandidates();
  let lastError = "알 수 없는 오류";

  for (const model of models) {
    const res = await callGemini(model, base64, mimeType);

    if (!res.ok) {
      const err = await res.text();
      lastError = formatGeminiError(res.status, err, model);
      if (res.status === 404 || res.status === 429) continue;
      throw new Error(lastError);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      lastError = "분석 결과를 받지 못했습니다.";
      continue;
    }

    return normalizeEntries(parseGeminiJson(text));
  }

  throw new Error(lastError);
}

export async function parseScoreImage(
  buffer: Buffer,
  mimeType: string,
): Promise<ParsedScoreboard> {
  const base64 = buffer.toString("base64");
  return parseWithGemini(base64, mimeType);
}

export async function parseScoreImages(
  files: { buffer: Buffer; mimeType: string }[],
): Promise<ParsedScoreboard> {
  const batches: ParsedScoreEntry[][] = [];
  let tab: string | null = null;

  for (const file of files) {
    const result = await parseScoreImage(file.buffer, file.mimeType);
    if (result.tab) tab = result.tab;
    if (result.entries.length > 0) {
      batches.push(result.entries);
    }
  }

  return { tab, entries: mergeScoreEntries(batches) };
}

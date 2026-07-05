import type { ParsedScoreEntry } from "@/lib/utils/score-image-parse";
import { mergeScoreEntries } from "@/lib/utils/score-image-parse";

function parseRelative(raw: string): number | null {
  const m = raw.trim().match(/^([+-])\s*(\d+)/);
  if (!m) return null;
  const n = parseInt(m[2], 10);
  return m[1] === "-" ? -n : n;
}

function cleanNickname(raw: string): string {
  return raw
    .replace(/^[\d\s.🥇🥈🥉|]+/, "")
    .replace(/\s*나\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[oO]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[@]/g, "!")
    .replace(/[_\-~]/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : Math.min(row[j] + 1, prev + 1, row[j - 1] + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

const SKIP_LINE =
  /스트로크|롱기|니어|신페리오|홀인원|다기록|라운드\s*완료|참여|CC|님의\s*방|마스터즈|벨라|탭|위\/|\d+명/i;

function findScoreOnLine(line: string): string | null {
  const m = line.match(/([+-])\s*(\d{1,3})/);
  if (!m) return null;
  return `${m[1]}${m[2]}`;
}

export function parseScoreTextWithDictionary(
  text: string,
  knownNicknames: string[],
): ParsedScoreEntry[] {
  const entries: ParsedScoreEntry[] = [];
  const used = new Set<string>();
  const lines = text.replace(/\r/g, "").split("\n");

  for (const nick of knownNicknames) {
    const normNick = normalizeForMatch(nick);
    if (!normNick || used.has(normNick)) continue;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || SKIP_LINE.test(trimmed)) continue;

      const scoreRaw = findScoreOnLine(trimmed);
      if (!scoreRaw) continue;

      const namePart = normalizeForMatch(trimmed.split(/[+-]/)[0] ?? trimmed);
      const exact = namePart.includes(normNick);
      const dist = exact
        ? 0
        : levenshtein(normNick, namePart.slice(0, normNick.length + 3));

      if (!exact && dist > 2) continue;

      used.add(normNick);
      entries.push({
        nickname: nick,
        scoreRaw,
        relativeToPar: parseRelative(scoreRaw),
        absoluteScore: null,
      });
      break;
    }
  }

  return entries;
}

export function parseScoreText(text: string): ParsedScoreEntry[] {
  const entries: ParsedScoreEntry[] = [];
  const seen = new Set<string>();

  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3 || SKIP_LINE.test(trimmed)) continue;

    const scoreMatch = trimmed.match(/([+-]\s*\d{1,3})\s*$/);
    if (!scoreMatch) continue;

    const scoreRaw = scoreMatch[1].replace(/\s/g, "");
    const before = trimmed.slice(0, scoreMatch.index ?? 0);
    const nickname = cleanNickname(before);

    if (nickname.length < 2 || /^\d+$/.test(nickname)) continue;

    const key = normalizeForMatch(nickname);
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({
      nickname,
      scoreRaw,
      relativeToPar: parseRelative(scoreRaw),
      absoluteScore: null,
    });
  }

  return entries;
}

export function parseScoreTextSmart(
  text: string,
  knownNicknames: string[],
): ParsedScoreEntry[] {
  const fromDict = parseScoreTextWithDictionary(text, knownNicknames);
  const dictKeys = new Set(fromDict.map((e) => normalizeForMatch(e.nickname)));
  const fromGeneric = parseScoreText(text).filter(
    (e) => !dictKeys.has(normalizeForMatch(e.nickname)),
  );
  return mergeScoreEntries([fromDict, fromGeneric]);
}

export function parseScoreLines(lines: string): ParsedScoreEntry[] {
  return parseScoreText(lines.replace(/,/g, " "));
}

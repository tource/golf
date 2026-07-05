import type { MemberNickname, Participant } from "@/lib/types/database";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

/** 닉네임 → 이번 라운드 참여자 매칭 */
export function resolveNicknameToParticipant(
  nickname: string,
  mappings: MemberNickname[],
  participants: Participant[],
): Participant | null {
  const key = normalize(nickname);
  if (!key) return null;

  const attending = participants.filter((p) => p.is_attending);

  const mapped = mappings.find((m) => normalize(m.nickname) === key);
  if (mapped) {
    const hit = attending.find(
      (p) => normalize(p.name) === normalize(mapped.member_name),
    );
    if (hit) return hit;
  }

  const byExactName = attending.find((p) => normalize(p.name) === key);
  if (byExactName) return byExactName;

  const byPartial = attending.find((p) => {
    const name = normalize(p.name);
    return name.includes(key) || key.includes(name);
  });
  if (byPartial) return byPartial;

  return null;
}

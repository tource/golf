const STORAGE_KEY = "nallyeobose_member_name";

export function getSavedMemberName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

export function saveMemberName(name: string) {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
}

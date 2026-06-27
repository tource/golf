import type { Participant } from "@/lib/types/database";

export function participantsToCSV(participants: Participant[]): string {
  const header = "이름,참여여부,신청시간,한마디";
  const rows = participants.map((p) => {
    const attending = p.is_attending ? "참여" : "불참";
    const time = new Date(p.created_at).toLocaleString("ko-KR");
    const comment = (p.comment ?? "").replace(/"/g, '""');
    return `"${p.name}","${attending}","${time}","${comment}"`;
  });
  return [header, ...rows].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

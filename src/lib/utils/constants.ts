export const ROOM_COLORS = [
  { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-300", ring: "ring-emerald-400" },
  { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-300", ring: "ring-blue-400" },
  { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-50", border: "border-orange-300", ring: "ring-orange-400" },
  { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50", border: "border-purple-300", ring: "ring-purple-400" },
  { bg: "bg-pink-500", text: "text-pink-700", light: "bg-pink-50", border: "border-pink-300", ring: "ring-pink-400" },
  { bg: "bg-teal-500", text: "text-teal-700", light: "bg-teal-50", border: "border-teal-300", ring: "ring-teal-400" },
  { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-300", ring: "ring-amber-400" },
  { bg: "bg-indigo-500", text: "text-indigo-700", light: "bg-indigo-50", border: "border-indigo-300", ring: "ring-indigo-400" },
  { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-300", ring: "ring-rose-400" },
  { bg: "bg-cyan-500", text: "text-cyan-700", light: "bg-cyan-50", border: "border-cyan-300", ring: "ring-cyan-400" },
];

export function getRoomColor(roomNumber: number) {
  return ROOM_COLORS[(roomNumber - 1) % ROOM_COLORS.length];
}

export function getDDay(targetDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

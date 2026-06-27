import type { Participant } from "@/lib/types/database";
import { shuffle } from "./shuffle";

export interface DrawResult {
  room_number: number;
  participant_id: string;
}

/**
 * 참여자를 랜덤 셔플 후 방 개수에 균등 분배합니다.
 * 각 방은 players_per_room을 초과하지 않도록, 가장 인원이 적은 방에 배정합니다.
 */
export function assignRooms(
  participants: Participant[],
  roomCount: number,
  playersPerRoom: number,
): DrawResult[] {
  const attending = participants.filter((p) => p.is_attending);
  const shuffled = shuffle(attending);
  const rooms: Participant[][] = Array.from({ length: roomCount }, () => []);

  for (const participant of shuffled) {
    const available = rooms
      .map((room, idx) => ({ idx, count: room.length }))
      .filter((r) => r.count < playersPerRoom)
      .sort((a, b) => a.count - b.count);

    const targetIdx =
      available.length > 0
        ? available[0].idx
        : rooms.reduce(
            (min, r, i) => (r.length < rooms[min].length ? i : min),
            0,
          );

    rooms[targetIdx].push(participant);
  }

  return rooms.flatMap((room, idx) =>
    room.map((p) => ({
      room_number: idx + 1,
      participant_id: p.id,
    })),
  );
}

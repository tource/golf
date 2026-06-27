export type RoundStatus = "open" | "closed" | "drawn" | "completed";

export interface Venue {
  id: string;
  name: string;
  address: string | null;
  price_per_hour: number | null;
  notes: string | null;
  created_at: string;
}

export interface Round {
  id: string;
  title: string;
  date: string;
  venue_id: string;
  room_count: number;
  players_per_room: number;
  status: RoundStatus;
  created_at: string;
  venues?: Venue;
}

export interface Participant {
  id: string;
  round_id: string;
  name: string;
  is_attending: boolean;
  comment: string | null;
  score: number | null;
  created_at: string;
}

export interface RoomAssignment {
  id: string;
  round_id: string;
  room_number: number;
  participant_id: string;
  participants?: Participant;
}

export interface RoundSettlement {
  round_id: string;
  total_cost: number | null;
  updated_at: string;
}

export interface CoffeeBet {
  id: string;
  round_id: string;
  payer_name: string;
  note: string | null;
  created_at: string;
}

export interface RoundWithVenue extends Round {
  venues: Venue;
}

export interface AssignmentWithParticipant extends RoomAssignment {
  participants: Participant;
}

export interface RoundResultData {
  round: RoundWithVenue;
  assignments: AssignmentWithParticipant[];
  participants: Participant[];
  settlement: RoundSettlement | null;
  coffeeBets: CoffeeBet[];
}

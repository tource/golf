import type { RoundStatus, RoundWithVenue } from "@/lib/types/database";

export type RoundStage =
  | "open"
  | "closed"
  | "assigned"
  | "settled";

export interface RoundStageInfo {
  stage: RoundStage;
  label: string;
  description: string;
  badgeClass: string;
}

export function getRoundStageInfo(
  status: RoundStatus,
  assignmentCount: number,
  hasSettlement: boolean,
): RoundStageInfo {
  if (status === "open") {
    return {
      stage: "open",
      label: "모집 중",
      description: "참여 신청을 받고 있어요",
      badgeClass: "bg-emerald-100 text-emerald-700",
    };
  }

  if (assignmentCount === 0) {
    return {
      stage: "closed",
      label: "신청 마감",
      description: "방 배정 전이에요",
      badgeClass: "bg-amber-100 text-amber-800",
    };
  }

  if (status === "completed" || hasSettlement) {
    return {
      stage: "settled",
      label: "정산 완료",
      description: "스코어·정산을 확인해 보세요",
      badgeClass: "bg-violet-100 text-violet-700",
    };
  }

  return {
    stage: "assigned",
    label: "배정 완료",
    description: "방 배정이 끝났어요",
    badgeClass: "bg-blue-100 text-blue-700",
  };
}

export function isActiveFeaturedRound(round: RoundWithVenue): boolean {
  return round.status === "open" || round.status === "closed" || round.status === "drawn";
}

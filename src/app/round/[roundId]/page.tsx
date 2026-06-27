import { RoundResultPage } from "@/components/round/round-result-page";

export default async function RoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  return <RoundResultPage roundId={roundId} />;
}

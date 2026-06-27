import { DrawReveal } from "@/components/draw/draw-reveal";

export default async function DrawPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ skip?: string }>;
}) {
  const { roundId } = await params;
  const { skip } = await searchParams;

  return (
    <DrawReveal
      roundId={roundId}
      skipAnimation={skip === "1"}
    />
  );
}

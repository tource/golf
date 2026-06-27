import { ParticipateForm } from "@/components/participate/participate-form";
import { redirect } from "next/navigation";

export default async function ParticipatePage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>;
}) {
  const params = await searchParams;

  if (!params.round) {
    redirect("/");
  }

  return <ParticipateForm roundId={params.round} />;
}

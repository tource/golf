import { Suspense } from "react";
import { AdminParticipantsPage } from "@/components/admin/admin-participants-page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-400">
          불러오는 중...
        </div>
      }
    >
      <AdminParticipantsPage />
    </Suspense>
  );
}

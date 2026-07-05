import { Suspense } from "react";
import { AdminRoomsPage } from "@/components/admin/admin-rooms-page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-400">
          불러오는 중...
        </div>
      }
    >
      <AdminRoomsPage />
    </Suspense>
  );
}

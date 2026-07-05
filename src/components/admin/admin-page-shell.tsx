"use client";

import { AdminNav } from "@/components/admin/admin-nav";

interface AdminPageShellProps {
  children: React.ReactNode;
}

export function AdminPageShell({ children }: AdminPageShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-emerald-100/60 ${className}`} />
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-14 w-full max-w-xs mx-auto" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-muted animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
          <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
          <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="rounded-xl border border-border/60 p-6">
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="mt-4 space-y-3">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-11/12 rounded bg-muted animate-pulse" />
            <div className="h-3 w-10/12 rounded bg-muted animate-pulse" />
          </div>
          <div className="mt-6 h-64 w-full rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-xl border border-border/60 bg-muted/20" />
          <div className="h-80 rounded-xl border border-border/60 bg-muted/20" />
        </div>
      </div>
    </div>
  );
}

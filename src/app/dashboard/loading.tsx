export default function Loading() {
  return (
    <div className="h-[calc(100dvh-64px)] bg-background flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 pt-8 pb-0 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-9 w-40 rounded bg-muted animate-pulse mb-2" />
            <div className="h-5 w-80 max-w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="h-5 w-44 rounded bg-muted animate-pulse hidden sm:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
          <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
          <div className="h-[108px] rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="h-10 rounded bg-muted animate-pulse mb-6" />

        <div className="flex-1 min-h-0">
          <div className="h-full overflow-y-auto pr-1 overscroll-contain">
            <div className="space-y-3">
              <div className="h-[120px] rounded-lg bg-muted animate-pulse" />
              <div className="h-[120px] rounded-lg bg-muted animate-pulse" />
              <div className="h-[120px] rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-border/70 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-9 w-20 rounded bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded bg-muted animate-pulse" />
            <div className="h-9 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

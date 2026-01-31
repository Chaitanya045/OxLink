export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-x-hidden">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted animate-pulse mb-8">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <div className="h-4 w-36 rounded bg-muted-foreground/20" />
            </div>

            <div className="h-20 w-[min(720px,95%)] mx-auto rounded bg-muted animate-pulse mb-6" />

            <div className="max-w-2xl mx-auto mb-12 space-y-3">
              <div className="h-6 w-[92%] mx-auto rounded bg-muted animate-pulse" />
              <div className="h-6 w-[86%] mx-auto rounded bg-muted animate-pulse" />
              <div className="h-6 w-[65%] mx-auto rounded bg-muted animate-pulse" />
            </div>

            <div className="max-w-2xl mx-auto rounded-2xl border border-border/60 p-5">
              <div className="h-12 w-full rounded bg-muted animate-pulse" />
              <div className="mt-3 h-12 w-40 rounded bg-muted animate-pulse mx-auto" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

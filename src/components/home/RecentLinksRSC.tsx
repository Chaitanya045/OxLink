import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import type { Url } from "@/types/dashboard";

interface RecentLinksRSCProps {
  urls: Url[];
}

export async function RecentLinksRSC({ urls }: RecentLinksRSCProps) {
  if (urls.length === 0) {
    return null;
  }

  return (
    <section className="py-10 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Recent Links</h2>
          </div>
          <Link href="/dashboard">
            <Button variant="link" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {await import("@/components/home/RecentLinksClient").then((m) => (
          <m.RecentLinksClient urls={urls} />
        ))}
      </div>
    </section>
  );
}

"use client";

import type { Url } from "@/types/dashboard";
import { DashboardUrlItem } from "@/components/dashboard/DashboardUrlItem";

interface RecentLinksClientProps {
  urls: Url[];
  onUrlUpdated?: () => void;
}

export function RecentLinksClient({ urls, onUrlUpdated }: RecentLinksClientProps) {
  return (
    <div className="space-y-3">
      {urls.map((url) => (
        <DashboardUrlItem key={url.id} url={url} onUrlUpdated={onUrlUpdated} />
      ))}
    </div>
  );
}

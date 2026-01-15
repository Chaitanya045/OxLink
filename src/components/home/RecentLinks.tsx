"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import type { Url } from "@/types/dashboard";
import { RecentLinkItem } from "./RecentLinkItem";

interface RecentLinksProps {
  urls: Url[];
  loading: boolean;
}

export function RecentLinks({ urls, loading }: RecentLinksProps) {
  if (loading) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-muted-foreground">Loading recent links...</p>
          </div>
        </div>
      </section>
    );
  }

  if (urls.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
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

        {/* Links List */}
        <div className="space-y-3">
          {urls.map((url) => (
            <RecentLinkItem key={url.id} url={url} />
          ))}
        </div>
      </div>
    </section>
  );
}

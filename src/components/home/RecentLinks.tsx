"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, BarChart3, Clock } from "lucide-react";
import type { Url } from "@/hooks/useUrlShortener";

interface RecentLinksProps {
  urls: Url[];
  loading: boolean;
}

export function RecentLinks({ urls, loading }: RecentLinksProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
            <Card key={url.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left Side - URL Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/analytics/${url.customAlias || url.shortCode}`}
                        className="text-primary font-medium hover:underline"
                      >
                        oxlink.io/{url.customAlias || url.shortCode}
                      </Link>
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LinkIcon className="h-3 w-3" />
                      <p className="truncate">{url.originalUrl}</p>
                    </div>
                  </div>

                  {/* Right Side - Stats & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">24 clicks</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-xs">
                      <QrCode className="h-3 w-3" />
                      <span>QR</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(url.shortUrl)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function QrCode({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
      />
    </svg>
  );
}

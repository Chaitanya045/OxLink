import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Share2, QrCode, Edit } from "lucide-react";
import { copyToClipboard } from "@/lib/analytics-utils";

interface AnalyticsHeaderProps {
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
}

export function AnalyticsHeader({
  shortCode,
  originalUrl,
  shortUrl,
}: AnalyticsHeaderProps) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground">Analytics</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">ox.link/{shortCode}</h1>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
              ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4 rotate-180" />
            <span>Redirects to: </span>
            <span className="text-foreground truncate max-w-md">
              {originalUrl}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(shortUrl)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="icon">
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, BarChart3, QrCode, Edit, Trash2 } from "lucide-react";
import type { Url } from "@/types/dashboard";
import { isUrlActive, getIconForUrl, getTimeSince, copyToClipboard } from "@/lib/analytics-utils";

interface DashboardUrlItemProps {
  url: Url;
}

export function DashboardUrlItem({ url }: DashboardUrlItemProps) {
  const isActive = isUrlActive(url.expiryDate);

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
            {getIconForUrl(url)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">
                  {url.customAlias || `Link ${url.id}`}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {url.originalUrl}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/analytics/${url.customAlias || url.shortCode}`}
                >
                  <span className="text-primary font-medium hover:underline">
                    ox.link/{url.customAlias || url.shortCode}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(url.shortUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {getTimeSince(url.createdAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/analytics/${url.customAlias || url.shortCode}`}
            >
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="font-semibold">{url.clickCount ?? 0}</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon">
              <QrCode className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

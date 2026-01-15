import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, BarChart3, QrCode, Edit, Trash2, Link2 } from "lucide-react";
import type { Url } from "@/types/dashboard";
import { isUrlActive, getTimeSince, copyToClipboard } from "@/lib/analytics-utils";

interface DashboardUrlItemProps {
  url: Url;
}

export function DashboardUrlItem({ url }: DashboardUrlItemProps) {
  const isActive = isUrlActive(url.expiryDate);
  const analyticsUrl = `/analytics/${url.customAlias || url.shortCode}`;

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link href={analyticsUrl} className="block">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Link2 className="h-5 w-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">
                    {url.customAlias || url.shortCode}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {url.originalUrl}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/${url.customAlias || url.shortCode}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary font-medium hover:underline"
                  >
                    {(() => {
                      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
                      try {
                        const urlObj = new URL(baseUrl);
                        const shortCode = url.customAlias || url.shortCode;
                        return `${urlObj.host}/${shortCode}`;
                      } catch {
                        // Fallback: extract domain from baseUrl string
                        const match = baseUrl.match(/https?:\/\/([^\/]+)/);
                        const shortCode = url.customAlias || url.shortCode;
                        if (match) {
                          return `${match[1]}/${shortCode}`;
                        }
                        return shortCode;
                      }
                    })()}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      handleActionClick(e);
                      copyToClipboard(url.shortUrl);
                    }}
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
            <div className="flex items-center gap-2 flex-shrink-0" onClick={handleActionClick}>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{url.clickCount ?? 0}</span>
              </div>
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
    </Link>
  );
}

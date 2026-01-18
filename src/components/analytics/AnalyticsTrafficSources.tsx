"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Globe } from "lucide-react";
import type { ReferrerData } from "@/types/analytics";

interface AnalyticsTrafficSourcesProps {
  referrerData: ReferrerData[];
}

function ReferrerItem({ referrer }: { referrer: ReferrerData }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-medium">{referrer.source}</div>
          <div className="text-sm text-muted-foreground">
            Social Media
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold">
          {referrer.count.toLocaleString()}
        </div>
        {referrer.change !== 0 && (
          <div
            className={`text-sm ${
              referrer.change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {referrer.change >= 0 ? "+" : ""}
            {referrer.change}%
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalyticsTrafficSources({
  referrerData,
}: AnalyticsTrafficSourcesProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const displayedReferrers = referrerData.slice(0, 3);
  const hasMore = referrerData.length > 3;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Traffic Sources</CardTitle>
            {hasMore && (
              <Button variant="link" size="sm" onClick={() => setModalOpen(true)}>
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayedReferrers.map((referrer) => (
              <ReferrerItem key={referrer.source} referrer={referrer} />
            ))}
            {displayedReferrers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No traffic source data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Traffic Sources</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {referrerData.map((referrer) => (
              <ReferrerItem key={referrer.source} referrer={referrer} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

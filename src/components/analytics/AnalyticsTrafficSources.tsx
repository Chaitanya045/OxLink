import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import type { ReferrerData } from "@/types/analytics";

interface AnalyticsTrafficSourcesProps {
  referrerData: ReferrerData[];
}

export function AnalyticsTrafficSources({
  referrerData,
}: AnalyticsTrafficSourcesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Traffic Sources</CardTitle>
          <Button variant="link" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrerData.map((referrer) => (
            <div
              key={referrer.source}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

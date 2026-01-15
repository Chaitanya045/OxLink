import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LocationData } from "@/types/analytics";

interface AnalyticsLocationListProps {
  locationData: LocationData[];
  totalClicks: number;
}

export function AnalyticsLocationList({
  locationData,
  totalClicks,
}: AnalyticsLocationListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top Locations</CardTitle>
          <Button variant="link" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {locationData.map((location) => (
            <div key={location.country} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  <span className="font-medium">{location.country}</span>
                </div>
                <span className="font-semibold">
                  {location.count.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${totalClicks > 0 ? (location.count / totalClicks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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
import type { LocationData } from "@/types/analytics";

interface AnalyticsLocationListProps {
  locationData: LocationData[];
  totalClicks: number;
}

function LocationItem({ location, totalClicks }: { location: LocationData; totalClicks: number }) {
  return (
    <div className="space-y-2">
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
  );
}

export function AnalyticsLocationList({
  locationData,
  totalClicks,
}: AnalyticsLocationListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const displayedLocations = locationData.slice(0, 3);
  const hasMore = locationData.length > 3;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Locations</CardTitle>
            {hasMore && (
              <Button variant="link" size="sm" onClick={() => setModalOpen(true)}>
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayedLocations.map((location) => (
              <LocationItem
                key={location.country}
                location={location}
                totalClicks={totalClicks}
              />
            ))}
            {displayedLocations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No location data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Locations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {locationData.map((location) => (
              <LocationItem
                key={location.country}
                location={location}
                totalClicks={totalClicks}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

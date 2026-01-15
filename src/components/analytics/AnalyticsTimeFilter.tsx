import { Button } from "@/components/ui/button";

export function AnalyticsTimeFilter() {
  return (
    <div className="flex items-center gap-2 mb-6">
      <Button variant="outline" size="sm">
        Last 7 Days
      </Button>
      <Button variant="ghost" size="sm">
        Last 30 Days
      </Button>
      <Button variant="ghost" size="sm">
        All Time
      </Button>
      <Button variant="ghost" size="sm">
        Custom
      </Button>
    </div>
  );
}

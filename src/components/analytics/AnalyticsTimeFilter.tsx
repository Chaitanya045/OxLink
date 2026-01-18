"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TimePeriod, DateRange } from "@/types/analytics";

interface AnalyticsTimeFilterProps {
  selectedPeriod: TimePeriod;
  customDateRange: DateRange | null;
  onPeriodChange: (period: TimePeriod) => void;
  onCustomRangeChange: (range: DateRange | null) => void;
}

export function AnalyticsTimeFilter({
  selectedPeriod,
  customDateRange,
  onPeriodChange,
  onCustomRangeChange,
}: AnalyticsTimeFilterProps) {
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Format date range for display
  const formatDateRange = (range: DateRange): string => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
    return `${formatDate(new Date(range.start))} - ${formatDate(new Date(range.end))}`;
  };

  const handlePeriodClick = (period: TimePeriod) => {
    if (period === "custom") {
      setCustomDialogOpen(true);
    } else {
      onPeriodChange(period);
      onCustomRangeChange(null);
    }
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate date range
      if (start > end) {
        alert("Start date must be before end date");
        return;
      }
      
      onCustomRangeChange({ start, end });
      onPeriodChange("custom");
      setCustomDialogOpen(false);
    }
  };

  const handleCustomCancel = () => {
    setCustomDialogOpen(false);
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={selectedPeriod === "7d" ? "outline" : "ghost"}
          size="sm"
          onClick={() => handlePeriodClick("7d")}
        >
          Last 7 Days
        </Button>
        <Button
          variant={selectedPeriod === "30d" ? "outline" : "ghost"}
          size="sm"
          onClick={() => handlePeriodClick("30d")}
        >
          Last 30 Days
        </Button>
        <Button
          variant={selectedPeriod === "all" ? "outline" : "ghost"}
          size="sm"
          onClick={() => handlePeriodClick("all")}
        >
          All Time
        </Button>
        <Button
          variant={selectedPeriod === "custom" ? "outline" : "ghost"}
          size="sm"
          onClick={() => handlePeriodClick("custom")}
        >
          Custom
        </Button>
        {selectedPeriod === "custom" && customDateRange && (
          <span className="text-sm text-muted-foreground ml-2">
            {formatDateRange(customDateRange)}
          </span>
        )}
      </div>

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCustomCancel}>
              Cancel
            </Button>
            <Button onClick={handleCustomApply} disabled={!startDate || !endDate}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

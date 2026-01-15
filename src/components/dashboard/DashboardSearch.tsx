import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Filter } from "lucide-react";

interface DashboardSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DashboardSearch({
  searchQuery,
  onSearchChange,
}: DashboardSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, URL, or short link..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <span className="mr-2">Status: Active</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <span className="mr-2">Sort: Date Created</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

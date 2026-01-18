import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardUrlItem } from "./DashboardUrlItem";
import type { Url } from "@/types/dashboard";

interface DashboardUrlListProps {
  urls: Url[];
  fetchingUrls: boolean;
  searchQuery?: string;
  onCreateWithAlias?: (alias: string) => void;
  onUrlUpdated?: () => void;
}

export function DashboardUrlList({
  urls,
  fetchingUrls,
  searchQuery,
  onCreateWithAlias,
  onUrlUpdated,
}: DashboardUrlListProps) {
  if (fetchingUrls) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading URLs...</p>
      </div>
    );
  }

  if (urls.length === 0) {
    // Show "No results found" if searching, otherwise show "Create Your First URL"
    if (searchQuery) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No results found for "{searchQuery}".
            </p>
            {onCreateWithAlias && (
              <Button onClick={() => onCreateWithAlias(searchQuery)}>
                Create URL as {searchQuery}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            You haven't created any short URLs yet.
          </p>
          <Link href="/">
            <Button>Create Your First URL</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {urls.map((url) => (
        <DashboardUrlItem key={url.id} url={url} onUrlUpdated={onUrlUpdated} />
      ))}
    </div>
  );
}

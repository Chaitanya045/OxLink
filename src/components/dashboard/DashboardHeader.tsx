"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  lastUpdated: Date | null;
}

function getLastUpdatedText(lastUpdated: Date | null): string {
  if (!lastUpdated) return "Just now";

  const now = new Date();
  const diffMs = now.getTime() - lastUpdated.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);

  if (diffSecs < 10) return "Just now";
  if (diffSecs < 60) return `${diffSecs} ${diffSecs === 1 ? "second" : "seconds"} ago`;
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  return "Just now";
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  const router = useRouter();
  const [lastUpdatedText, setLastUpdatedText] = useState(
    getLastUpdatedText(lastUpdated)
  );

  useEffect(() => {
    // Update the text immediately
    setLastUpdatedText(getLastUpdatedText(lastUpdated));

    // Update every second to keep it current
    const interval = setInterval(() => {
      setLastUpdatedText(getLastUpdatedText(lastUpdated));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Links</h1>
        <p className="text-muted-foreground">
          Manage and track your shortened URLs performance.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground hidden sm:block">
          Last updated: {lastUpdatedText}
        </p>
      </div>
    </div>
  );
}

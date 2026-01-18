"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const router = useRouter();

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
          Last updated: Just now
        </p>
      </div>
    </div>
  );
}

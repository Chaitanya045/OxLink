import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AuthTabsProps {
  activeTab: "login" | "signup";
}

export function AuthTabs({ activeTab }: AuthTabsProps) {
  return (
    <div className="flex gap-2">
      <Link href="/auth/signin" className="flex-1">
        <Button
          variant={activeTab === "login" ? "default" : "outline"}
          size="lg"
          className="w-full"
        >
          Login
        </Button>
      </Link>
      <Link href="/auth/signup" className="flex-1">
        <Button
          variant={activeTab === "signup" ? "default" : "outline"}
          size="lg"
          className="w-full"
        >
          Sign Up
        </Button>
      </Link>
    </div>
  );
}

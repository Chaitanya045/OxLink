import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  isLoggedIn: boolean;
  onGetStarted?: () => void;
}

export function Navbar({ isLoggedIn, onGetStarted }: NavbarProps) {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">OxLink</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </Link>
            <ThemeToggle />
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Button size="sm" onClick={onGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

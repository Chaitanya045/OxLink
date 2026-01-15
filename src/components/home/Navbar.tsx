"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LinkIcon, User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth-client";

interface NavbarProps {
  isLoggedIn: boolean;
}

export function Navbar({ isLoggedIn }: NavbarProps) {
  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Clear any local storage items
            localStorage.removeItem("pendingShortUrl");
            // Redirect to home page with full reload
            window.location.href = "/";
          },
        },
      });
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if there's an error, redirect to home page
      window.location.href = "/";
    }
  };

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
            {isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-5 w-5" />
                      <span className="sr-only">Profile menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ThemeToggle />
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <ThemeToggle />
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

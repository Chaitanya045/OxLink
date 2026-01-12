import Link from "next/link";
import { LinkIcon } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <LinkIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">OxLink</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="hover:text-foreground transition-colors"
            >
              Contact Support
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} OxLink Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

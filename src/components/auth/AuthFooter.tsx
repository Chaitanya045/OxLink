import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="absolute bottom-0 left-0 right-0 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
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
            href="/help"
            className="hover:text-foreground transition-colors"
          >
            Help Center
          </Link>
        </div>
      </div>
    </footer>
  );
}

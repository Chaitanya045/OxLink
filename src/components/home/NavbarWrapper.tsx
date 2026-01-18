"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { useSession } from "@/hooks/useSession";

export function NavbarWrapper() {
  const pathname = usePathname();
  const { session, loading, checkSession } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, [checkSession]);

  // Hide navbar on auth pages
  const isAuthPage = pathname?.startsWith("/auth");
  if (isAuthPage) {
    return null;
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return <Navbar isLoggedIn={!!session} />;
}

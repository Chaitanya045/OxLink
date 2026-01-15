"use client";

import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { useSession } from "@/hooks/useSession";

export function NavbarWrapper() {
  const { session, loading, checkSession } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, [checkSession]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return <Navbar isLoggedIn={!!session} />;
}

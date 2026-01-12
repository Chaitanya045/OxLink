import { useState, useCallback } from "react";

export interface Session {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const data: Session = await response.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { session, loading, checkSession, setSession };
}

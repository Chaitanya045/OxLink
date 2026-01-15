import { useState, useCallback } from "react";
import type { Url } from "@/types/dashboard";

interface CreateUrlData {
  originalUrl: string;
  customAlias?: string;
  expiryDate?: string;
}

export function useUrlShortener() {
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const createShortUrl = useCallback(async (data: CreateUrlData) => {
    setError("");
    setShortUrl("");
    setCreating(true);

    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Failed to create short URL");
      }

      const resData = await response.json();
      setShortUrl(resData.data.shortUrl);
      return resData.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  const resetState = useCallback(() => {
    setShortUrl("");
    setError("");
  }, []);

  return {
    shortUrl,
    error,
    creating,
    createShortUrl,
    resetState,
  };
}

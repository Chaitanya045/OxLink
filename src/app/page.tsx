"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Link as LinkIcon, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type Session = {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
};

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const data: Session = await response.json();
        setSession(data);
      } else {
        router.push("/auth/signin");
      }
    } catch {
      router.push("/auth/signin");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });
    router.push("/auth/signin");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShortUrl("");
    setCreating(true);

    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias || undefined,
          expiryDate: expiryDate || undefined,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create short URL");
      }

      const data = await response.json();
      setShortUrl(data.data.shortUrl);
      setOriginalUrl("");
      setCustomAlias("");
      setExpiryDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">OxLink</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Welcome, {session?.user?.name || session?.user?.email}
            </p>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Short URL</CardTitle>
              <CardDescription>
                Shorten your long URLs and share them easily
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="url">Long URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/very/long/url"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias">Custom Alias (optional)</Label>
                  <Input
                    id="alias"
                    type="text"
                    placeholder="my-custom-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for auto-generated code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date (optional)</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? "Creating..." : "Shorten URL"}
                </Button>
              </form>

              {shortUrl && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                    Short URL created successfully!
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={shortUrl} readOnly className="flex-1" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

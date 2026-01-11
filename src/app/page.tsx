"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { signOut } from "@/lib/auth-client";

type Session = {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
};

type Url = {
  id: number;
  shortCode: string;
  originalUrl: string;
  customAlias: string | null;
  shortUrl: string;
  expiryDate: string | null;
  createdAt: string;
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
  const [recentUrls, setRecentUrls] = useState<Url[]>([]);
  const [totalUrlCount, setTotalUrlCount] = useState(0);

  const fetchRecentUrls = useCallback(async () => {
    try {
      const response = await fetch("/api/urls?page=1&limit=3", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRecentUrls(data.data);
        setTotalUrlCount(data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch recent URLs", error);
    }
  }, []);

  // Helper to create short URL
  const createShortUrl = async (data: {
    originalUrl: string;
    customAlias?: string;
    expiryDate?: string;
  }) => {
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

      // Clear form only on success
      setOriginalUrl("");
      setCustomAlias("");
      setExpiryDate("");

      // Refresh list
      fetchRecentUrls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreating(false);
    }
  };

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

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (session) {
      fetchRecentUrls();
    }
  }, [session, fetchRecentUrls]);

  // Handle pending actions after login
  useEffect(() => {
    if (session && !loading) {
      const pending = localStorage.getItem("pendingShortUrl");
      if (pending) {
        try {
          const data = JSON.parse(pending);
          // Auto-submit the pending URL
          createShortUrl(data);
          // Clear the pending item
          localStorage.removeItem("pendingShortUrl");
        } catch (e) {
          console.error("Failed to parse pending url", e);
          localStorage.removeItem("pendingShortUrl");
        }
      }
    }
  }, [session, loading]);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          // Clear local state
          setSession(null);
          setRecentUrls([]);
          router.refresh();
        },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      // Store data and redirect to login
      localStorage.setItem(
        "pendingShortUrl",
        JSON.stringify({
          originalUrl,
          customAlias: customAlias || undefined,
          expiryDate: expiryDate || undefined,
        })
      );
      router.push("/auth/signin");
      return;
    }

    await createShortUrl({
      originalUrl,
      customAlias: customAlias || undefined,
      expiryDate: expiryDate || undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isUrlActive = (expiryDate: string | null) => {
    if (!expiryDate) return true;
    return new Date(expiryDate) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">OxLink</h1>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {session.user?.name || session.user?.email}
                </p>
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link href="/auth/signin">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
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
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
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
                      onClick={() => copyToClipboard(shortUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent URLs Section */}
          {session && recentUrls.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent URLs</CardTitle>
                    <CardDescription>
                      Your recently generated short links
                    </CardDescription>
                  </div>
                  {totalUrlCount > 3 && (
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm">
                        View More
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUrls.slice(0, 3).map((url) => {
                    const isActive = isUrlActive(url.expiryDate);
                    return (
                      <div
                        key={url.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card text-card-foreground gap-4"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <a
                              href={url.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline truncate block"
                            >
                              {url.shortUrl}
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(url.shortUrl)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p
                            className="text-sm text-muted-foreground truncate"
                            title={url.originalUrl}
                          >
                            {url.originalUrl}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(url.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

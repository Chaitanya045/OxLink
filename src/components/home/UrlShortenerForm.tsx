"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LinkIcon, Zap, ChevronDown } from "lucide-react";
import { useUrlShortener } from "@/hooks/useUrlShortener";
import type { Session } from "@/types/dashboard";
import { toast } from "sonner";

interface UrlShortenerFormProps {
  session: Session | null;
  onUrlCreated?: () => void;
  pendingUrlData?: { originalUrl: string; customAlias?: string } | null;
  onPendingDataHandled?: () => void;
}

export function UrlShortenerForm({
  session,
  onUrlCreated,
  pendingUrlData,
  onPendingDataHandled,
}: UrlShortenerFormProps) {
  const router = useRouter();
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { shortUrl, error, creating, createShortUrl, resetState } =
    useUrlShortener();

  // Auto-submit pending URL data when session becomes available
  useEffect(() => {
    if (session && pendingUrlData && !creating && !shortUrl) {
      const submitPendingUrl = async () => {
        try {
          const result = await createShortUrl({
            originalUrl: pendingUrlData.originalUrl,
            customAlias: pendingUrlData.customAlias,
          });
          toast.success("URL created successfully!", {
            description: result.shortUrl,
          });
          // Clear form state
          setOriginalUrl("");
          setCustomAlias("");
          setShowAdvanced(false);
          // Notify parent that pending data was handled
          onPendingDataHandled?.();
          // Notify parent of URL creation
          onUrlCreated?.();
        } catch (err) {
          // Error is handled by the hook
          // Still notify parent that we attempted to handle pending data
          onPendingDataHandled?.();
        }
      };
      submitPendingUrl();
    }
  }, [session, pendingUrlData, creating, shortUrl, createShortUrl, onPendingDataHandled, onUrlCreated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      // Store data and redirect to login
      localStorage.setItem(
        "pendingShortUrl",
        JSON.stringify({
          originalUrl,
          customAlias: customAlias || undefined,
        })
      );
      router.push("/auth/signin");
      return;
    }

    try {
      const result = await createShortUrl({
        originalUrl,
        customAlias: customAlias || undefined,
      });

      toast.success("URL created successfully!", {
        description: result.shortUrl,
      });

      // Clear form on success
      setOriginalUrl("");
      setCustomAlias("");
      setShowAdvanced(false);

      // Notify parent
      onUrlCreated?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4">
      <Card className="bg-card/50 backdrop-blur border-2">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            {/* Main Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Paste your long link here..."
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  required
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={creating}
                className="px-8"
              >
                {creating ? (
                  "Creating..."
                ) : (
                  <>
                    Shorten URL
                    <Zap className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
              Advanced Options (Custom Alias)
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="pt-2 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Custom Alias (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="my-custom-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for auto-generated code
                  </p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {shortUrl && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Short URL created successfully!
                </p>
                <div className="flex items-center gap-2">
                  <Input value={shortUrl} readOnly className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(shortUrl)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Url } from "@/types/dashboard";

interface EditUrlModalProps {
  url: Url | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditUrlModal({
  url,
  open,
  onOpenChange,
  onSuccess,
}: EditUrlModalProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset form when URL changes or modal opens/closes
  useEffect(() => {
    if (url && open) {
      setOriginalUrl(url.originalUrl);
      // Format expiry date for date input (YYYY-MM-DD)
      if (url.expiryDate) {
        const date = new Date(url.expiryDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        setExpiryDate(`${year}-${month}-${day}`);
      } else {
        setExpiryDate("");
      }
      setError("");
    } else if (!open) {
      setOriginalUrl("");
      setExpiryDate("");
      setError("");
    }
  }, [url, open]);

  const handleSave = async () => {
    if (!url) return;

    setError("");
    setSaving(true);

    try {
      const updateData: { originalUrl?: string; expiryDate?: string | null } = {};

      if (originalUrl !== url.originalUrl) {
        updateData.originalUrl = originalUrl;
      }

      if (expiryDate !== "") {
        // Convert date string to end of day timestamp
        const date = new Date(expiryDate);
        date.setHours(23, 59, 59, 999); // Set to end of day
        updateData.expiryDate = date.toISOString();
      } else if (url.expiryDate) {
        // If expiry date was cleared, set to null
        updateData.expiryDate = null;
      }

      const response = await fetch(`/api/urls/update/${url.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update URL");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit URL</DialogTitle>
          <DialogDescription>
            Update your shortened URL. Changing the destination URL will create
            a new version to preserve analytics history.
            {url.version !== undefined && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Current version: {url.version}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="original-url">Destination URL</Label>
            <Input
              id="original-url"
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
            <Input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiration
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

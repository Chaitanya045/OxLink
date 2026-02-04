"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiPath } from "@/lib/paths";
import { apiJson } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";

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
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (args: {
      urlId: number;
      updateData: { originalUrl?: string; expiryDate?: string | null };
    }) => {
      return apiJson<{ success: true; data: Url }>(
        apiPath(`/api/urls/update/${args.urlId}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: args.updateData,
          credentials: "include",
        }
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.urls.stats });
      await queryClient.invalidateQueries({ queryKey: queryKeys.urls.recent });
      await queryClient.invalidateQueries({ queryKey: ["urls", "list"] });
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && url) {
      setOriginalUrl(url.originalUrl);

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
      mutation.reset();
    }

    if (!nextOpen) {
      setOriginalUrl("");
      setExpiryDate("");
      setError("");
      mutation.reset();
    }

    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!url) return;

    setError("");

    if (mutation.isPending) return;

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

      await mutation.mutateAsync({ urlId: url.id, updateData });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
            <Input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={mutation.isPending}
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
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

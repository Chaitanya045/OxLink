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
import { useUrlShortener } from "@/hooks/useUrlShortener";
import { isValidUrl } from "@/lib/utils";
import { toast } from "sonner";

interface CreateUrlModalProps {
  prefilledAlias: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUrlModal({
  prefilledAlias,
  open,
  onOpenChange,
  onSuccess,
}: CreateUrlModalProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const { error, creating, createShortUrl, resetState } = useUrlShortener();

  // Reset form when modal opens/closes or prefilledAlias changes
  useEffect(() => {
    if (open) {
      setOriginalUrl("");
      setCustomAlias(prefilledAlias || "");
      setExpiryDate("");
      resetState();
    } else {
      setOriginalUrl("");
      setCustomAlias("");
      setExpiryDate("");
    }
  }, [open, prefilledAlias, resetState]);

  const handleCreate = async () => {
    if (!isValidUrl(originalUrl)) {
      return;
    }

    try {
      // Format expiry date to end of day if provided
      let formattedExpiryDate: string | undefined = undefined;
      if (expiryDate) {
        const date = new Date(expiryDate);
        date.setHours(23, 59, 59, 999); // Set to end of day
        formattedExpiryDate = date.toISOString();
      }

      const result = await createShortUrl({
        originalUrl,
        customAlias: customAlias || undefined,
        expiryDate: formattedExpiryDate,
      });

      toast.success("URL created successfully!", {
        description: result.shortUrl,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Short URL</DialogTitle>
          <DialogDescription>
            Create a new shortened URL with your custom alias.
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
              disabled={creating}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-alias">Custom Alias (optional)</Label>
            <Input
              id="custom-alias"
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              placeholder="my-custom-link"
              disabled={creating}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for auto-generated code
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
            <Input
              id="expiry-date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={creating}
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
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !originalUrl || !isValidUrl(originalUrl)}
          >
            {creating ? "Creating..." : "Create URL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

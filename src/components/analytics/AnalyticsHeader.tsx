"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, QrCode, Edit } from "lucide-react";
import { isUrlActive } from "@/lib/analytics-utils";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { EditUrlModal } from "@/components/dashboard/EditUrlModal";
import { QrCodeModal } from "@/components/dashboard/QrCodeModal";
import type { UrlInfo } from "@/types/analytics";

interface AnalyticsHeaderProps {
  urlInfo: UrlInfo;
  onUrlUpdated?: () => void;
}

export function AnalyticsHeader({
  urlInfo,
  onUrlUpdated,
}: AnalyticsHeaderProps) {
  const { copy } = useCopyToClipboard();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const { shortCode, originalUrl, shortUrl, expiryDate } = urlInfo;
  // Extract domain from shortUrl or use base URL from env
  const getDisplayUrl = () => {
    try {
      const url = new URL(shortUrl);
      return `${url.host}/${shortCode}`;
    } catch {
      // Fallback to environment variable or default
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      try {
        const url = new URL(baseUrl);
        return `${url.host}/${shortCode}`;
      } catch {
        // Last resort: extract domain from baseUrl string
        const match = baseUrl.match(/https?:\/\/([^\/]+)/);
        if (match) {
          return `${match[1]}/${shortCode}`;
        }
        return shortCode;
      }
    }
  };

  const isActive = isUrlActive(expiryDate);

  // Convert UrlInfo to Url type for EditUrlModal
  const urlForEdit = {
    id: urlInfo.id,
    shortCode: urlInfo.shortCode,
    originalUrl: urlInfo.originalUrl,
    customAlias: urlInfo.customAlias,
    shortUrl: urlInfo.shortUrl,
    expiryDate: urlInfo.expiryDate,
    createdAt: urlInfo.createdAt,
    version: urlInfo.version,
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    if (onUrlUpdated) {
      onUrlUpdated();
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground">Analytics</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{getDisplayUrl()}</h1>
            {isActive ? (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                ACTIVE
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 rounded">
                INACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4 rotate-180" />
            <span>Redirects to: </span>
            <span className="text-foreground truncate max-w-md">
              {originalUrl}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(shortUrl)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="icon" onClick={() => setQrModalOpen(true)}>
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setEditModalOpen(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <QrCodeModal
        shortUrl={shortUrl}
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
      <EditUrlModal
        url={urlForEdit}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}

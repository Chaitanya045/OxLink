"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, BarChart3, QrCode, Edit, Link2 } from "lucide-react";
import type { Url } from "@/types/dashboard";
import { isUrlActive, getTimeSinceWithLabel } from "@/lib/analytics-utils";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { EditUrlModal } from "./EditUrlModal";
import { QrCodeModal } from "./QrCodeModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardUrlItemProps {
  url: Url;
  onUrlUpdated?: () => void;
}

export function DashboardUrlItem({ url, onUrlUpdated }: DashboardUrlItemProps) {
  const router = useRouter();
  const { copy } = useCopyToClipboard();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const isActive = isUrlActive(url.expiryDate);
  const analyticsUrl = `/analytics/${url.customAlias || url.shortCode}`;

  const handleCardClick = () => {
    router.push(analyticsUrl);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    handleActionClick(e);
    setEditModalOpen(true);
  };

  const handleQrClick = (e: React.MouseEvent) => {
    handleActionClick(e);
    setQrModalOpen(true);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    if (onUrlUpdated) {
      onUrlUpdated();
    }
  };

  return (
    <>
      <Card 
        className="hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Link2 className="h-5 w-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <a
                  href={url.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-lg mb-1 text-primary hover:underline cursor-pointer inline"
                >
                  {url.customAlias || url.shortCode}
                </a>
                <p className="text-sm text-muted-foreground truncate">
                  {url.originalUrl}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {getTimeSinceWithLabel(url.createdAt, url.updatedAt)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0" onClick={handleActionClick}>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  handleActionClick(e);
                  copy(url.shortUrl);
                }}
                title="Copy short link"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{url.clickCount ?? 0}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleQrClick}>
                <QrCode className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleEditClick}>
                <Edit className="h-4 w-4" />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center h-10 w-10 cursor-pointer">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          isActive
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isActive ? "Active" : "Inactive"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
      <EditUrlModal
        url={url}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
      />
      <QrCodeModal
        shortUrl={url.shortUrl}
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
      />
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/analytics-utils";

interface QrCodeModalProps {
  shortUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrCodeModal({ shortUrl, open, onOpenChange }: QrCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!qrRef.current) return;

    setDownloading(true);
    try {
      // Extract short code from shortUrl (e.g., "http://localhost:3000/abc123" -> "abc123")
      const shortCode = shortUrl.split("/").pop() || "qr-code";
      const fileName = `${shortCode}.jpg`;

      // Get the SVG element
      const svgElement = qrRef.current.querySelector("svg");
      if (!svgElement) return;

      // Convert SVG to canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = async () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Always download as JPG
          const mimeType = "image/jpeg";

          canvas.toBlob((blob) => {
            if (!blob) {
              URL.revokeObjectURL(url);
              setDownloading(false);
              return;
            }

            // Download the image
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            URL.revokeObjectURL(url);
            setDownloading(false);
          }, mimeType);
        } catch (error) {
          console.error("Failed to convert QR code:", error);
          URL.revokeObjectURL(url);
          setDownloading(false);
        }
      };

      img.onerror = () => {
        console.error("Failed to load SVG image");
        URL.revokeObjectURL(url);
        setDownloading(false);
      };

      img.src = url;
    } catch (error) {
      console.error("Failed to download QR code:", error);
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(shortUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access your shortened URL
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-lg border-2 border-border"
          >
            <QRCodeSVG
              value={shortUrl}
              size={256}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Short URL Text */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Short URL</p>
            <p className="font-medium break-all">{shortUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>

            <Button
              variant="default"
              className="w-full"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

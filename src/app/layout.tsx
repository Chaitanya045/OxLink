import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "OxLink - URL Shortener",
  description: "Shorten your URLs and share them easily",
};

const NavbarWrapper = dynamic(
  () => import("@/components/home/NavbarWrapper").then((m) => m.NavbarWrapper),
  {
    ssr: true,
  }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NavbarWrapper />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

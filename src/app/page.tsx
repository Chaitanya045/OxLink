"use client";

import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useRecentUrls } from "@/hooks/useRecentUrls";
import { Navbar } from "@/components/home/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { UrlShortenerForm } from "@/components/home/UrlShortenerForm";
import { RecentLinks } from "@/components/home/RecentLinks";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  const { session, loading: sessionLoading, checkSession } = useSession();
  const { recentUrls, loading: urlsLoading, fetchRecentUrls } = useRecentUrls();

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Fetch recent URLs when session is available
  useEffect(() => {
    if (session) {
      fetchRecentUrls();
    }
  }, [session, fetchRecentUrls]);

  // Handle pending URL creation after login
  useEffect(() => {
    if (session && !sessionLoading) {
      const pending = localStorage.getItem("pendingShortUrl");
      if (pending) {
        localStorage.removeItem("pendingShortUrl");
        // The form will handle this through its own state
      }
    }
  }, [session, sessionLoading]);

  const handleUrlCreated = () => {
    // Refresh recent URLs list
    if (session) {
      fetchRecentUrls();
    }
  };

  const handleGetStarted = () => {
    // Scroll to the form
    const formElement = document.getElementById("url-shortener-form");
    formElement?.scrollIntoView({ behavior: "smooth" });
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar isLoggedIn={!!session} onGetStarted={handleGetStarted} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* URL Shortener Form */}
        <div id="url-shortener-form">
          <UrlShortenerForm session={session} onUrlCreated={handleUrlCreated} />
        </div>

        {/* Recent Links */}
        {session && <RecentLinks urls={recentUrls} loading={urlsLoading} />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

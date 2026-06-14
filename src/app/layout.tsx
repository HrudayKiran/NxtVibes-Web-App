"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { useThemeStore } from "@/store/themeStore";
import { Navigation } from "@/components/Navigation";
import { AIAssistantDrawer } from "@/components/AIAssistantDrawer";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Outfit, Inter, Space_Grotesk } from "next/font/google";
import "react-day-picker/dist/style.css";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppInit({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((state) => state.initTheme);
  const [mounted, setMounted] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initTheme();
    setMounted(true);

    const checkRoute = () => {
      const allowedRoutes = ["/", "/privacy", "/terms"];
      if (!allowedRoutes.includes(pathname)) {
        router.replace("/");
      } else {
        setAuthLoading(false);
      }
    };

    checkRoute();

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, [initTheme, pathname, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold animate-pulse">Loading NxtVibes...</p>
        </div>
      </div>
    );
  }

  const allowedRoutes = ["/", "/privacy", "/terms"];
  const isAllowed = allowedRoutes.includes(pathname);

  if (!isAllowed) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold animate-pulse">Redirecting to landing page...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/" || pathname === "/privacy" || pathname === "/terms";
  const showSidebar = !isPublicPage && pathname !== "/login" && pathname !== "/register";

  return (
    <html lang="en" className={cn("h-full", outfit.variable, inter.variable, spaceGrotesk.variable)}>
      <head>
        <title>NxtVibes — Group Travel Planner & Itinerary Builder</title>
        <link rel="preconnect" href="https://pcbeldwtogqhffpssjlt.supabase.co" />
        <meta name="google-site-verification" content="wJtck-og082aWD4gT4bN8xBxwQovZwbKlpzPme3RoWg" />
        <meta name="description" content="Ditch the WhatsApp planning chaos. Build day-wise itineraries, auto-pin stops on shared Google Maps, chat in real-time, and sort photos instantly with AI face-scanning." />
        <meta name="keywords" content="travel planner, group travel, itinerary builder, shared map, trip collaboration, face scanner photo sort, split bills" />
        <meta property="og:title" content="NxtVibes — Group Travel Planner & Itinerary Builder" />
        <meta property="og:description" content="Collaborative trip planning for squads who actually travel together. Get day-wise itineraries, shared checklists, and group chats in one place." />
        <meta property="og:url" content="https://nxtvibes.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NxtVibes — Group Travel Planner" />
        <meta name="twitter:description" content="Collaborative trip planning for squads who actually travel together. Get day-wise itineraries, shared checklists, and group chats in one place." />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EDEFDL3XEN"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EDEFDL3XEN');
          `}
        </Script>
      </head>
      <body className="min-h-full bg-background text-foreground antialiased selection:bg-primary/20">
        <div className="mesh-bg" />
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AppInit>
              {isPublicPage ? (
                <main className="flex-1 flex flex-col min-h-screen relative">
                  {children}
                </main>
              ) : (
                <div className="flex min-h-screen flex-col md:flex-row">
                  <Navigation />
                  <main className={cn(
                    "flex-1 pt-16 pb-16 md:pt-0 md:pb-0 flex flex-col min-h-screen relative",
                    showSidebar && "md:pl-64"
                  )}>
                    {children}
                    {showSidebar && <AIAssistantDrawer />}
                  </main>
                </div>
              )}
            </AppInit>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

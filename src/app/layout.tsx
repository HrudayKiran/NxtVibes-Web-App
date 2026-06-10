"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import { useThemeStore } from "@/store/themeStore";
import { Navigation } from "@/components/Navigation";
import { AIAssistantDrawer } from "@/components/AIAssistantDrawer";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import "react-day-picker/dist/style.css";
import "./globals.css";

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
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initTheme();
    setMounted(true);

    const checkAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        const isPublicRoute = ["/", "/login", "/register", "/privacy", "/terms"].includes(pathname);
        if (!currentSession?.user && !isPublicRoute) {
          router.replace("/login");
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      const isPublicRoute = ["/", "/login", "/register", "/privacy", "/terms"].includes(pathname);
      if (!currentSession?.user && !isPublicRoute) {
        router.replace("/login");
      } else {
        setAuthLoading(false);
      }
    });

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    return () => subscription.unsubscribe();
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

  const isPublicRoute = ["/", "/login", "/register", "/privacy", "/terms"].includes(pathname);

  // If checking authentication on a protected route, show a loader instead of rendering the protected page
  if (authLoading && !isPublicRoute) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If checking is done and user is not authenticated on a protected route, block render (redirection in progress)
  if (!session?.user && !isPublicRoute) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold animate-pulse">Redirecting to login...</p>
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
  const showSidebar = pathname !== "/login" && pathname !== "/register" && pathname !== "/" && pathname !== "/privacy" && pathname !== "/terms";

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased selection:bg-primary/20">
        <div className="mesh-bg" />
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AppInit>
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
            </AppInit>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

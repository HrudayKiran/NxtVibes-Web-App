"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, PlusCircle, MessageSquare, Settings, LogOut, Menu, User, Sun, Moon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/store/themeStore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Compass },
  { label: "Plan Trip", href: "/itineraries/new", icon: PlusCircle },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(data || { name: "Traveler", username: user.email?.split("@")[0] });
      setLoading(false);
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        fetchProfile();
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Auth and public pages don't show navigation
  if (pathname === "/login" || pathname === "/register" || pathname === "/" || pathname === "/privacy" || pathname === "/terms") {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation (Left Sidebar) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card px-4 py-6 md:flex md:flex-col justify-between z-40 shadow-premium">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-glow">
              NV
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">NxtVibes</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Web Travel Companion</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            {isDarkMode ? (
              <>
                <Sun className="h-5 w-5 text-accent" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-5 w-5" />
                Dark Mode
              </>
            )}
          </button>

          {profile && (
            <div className="flex items-center gap-3 px-3 py-2 border-t border-border pt-4">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary font-semibold">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-none">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">@{profile.username || "traveler"}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/5 transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="fixed top-0 inset-x-0 h-16 border-b border-border bg-card/85 backdrop-blur-md flex items-center justify-between px-4 md:hidden z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base shadow-glow">
            NV
          </div>
          <span className="font-bold text-base">NxtVibes</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-full hover:bg-muted text-foreground transition-all cursor-pointer"
          >
            {isDarkMode ? <Sun className="h-5 w-5 text-accent" /> : <Moon className="h-5 w-5" />}
          </button>

          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Toggle navigation menu"
                className="p-2 rounded-full hover:bg-muted text-foreground cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col justify-between">
              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-3 px-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-glow">
                    NV
                  </div>
                  <div>
                    <h1 className="font-bold text-lg leading-none">NxtVibes</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Travel Companion</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4">
                {profile && (
                  <div className="flex items-center gap-3 px-3 py-2 border-t border-border pt-4">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
                      {profile.photo_url ? (
                        <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary font-semibold">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate leading-none">{profile.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">@{profile.username || "traveler"}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/5 transition-all cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 h-16 border-t border-border bg-card/90 backdrop-blur-md flex items-center justify-around md:hidden z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 text-[10px] font-semibold transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

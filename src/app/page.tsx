"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Compass, MapPin, Calendar, Users, MessageSquare, Plus, 
  ArrowRight, Sparkles, Globe, Shield, CheckCircle, Clock, Check,
  Sun, Moon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/store/themeStore";

export default function Home() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDemo, setActiveDemo] = useState<"timeline" | "map" | "chats" | "ai">("timeline");
  const [chatType, setChatType] = useState<"group" | "direct">("group");
  const [aiPromptClicked, setAiPromptClicked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 w-full z-50 border-b border-border/20 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-glow">
              NV
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              NxtVibes
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-muted text-foreground transition-all cursor-pointer border border-border/15 bg-card/45 backdrop-blur-sm shadow-sm flex items-center justify-center"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4" />}
            </button>

            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-premium hover:opacity-90 transition-opacity"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold hover:text-primary transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-premium hover:opacity-90 transition-opacity"
                >
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - Split Screen layout */}
      <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-20 pb-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline and Actions */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            Cooperative Travel Planning Redefined
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight bg-gradient-to-b from-foreground to-foreground/75 bg-clip-text text-transparent">
            Plan Your Next <br/>
            <span className="bg-gradient-to-r from-primary via-brand-pink to-brand-cyan bg-clip-text text-transparent">Travel Vibe</span> Together
          </h1>

          <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
            Planning trips shouldn't feel like work. Sync your maps, checklist goals, notes, and schedules in a single dynamic board. Experience collaborative traveling with AI recommendation assistance.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-2xl btn-premium px-8 py-4 text-sm font-bold text-primary-foreground shadow-premium w-full sm:w-auto"
              >
                Enter Dashboard
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 rounded-2xl btn-premium px-8 py-4 text-sm font-bold text-primary-foreground shadow-premium w-full sm:w-auto"
                >
                  Create a Plan for Free
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <a
                  href="#features"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card/65 backdrop-blur-md px-8 py-4 text-sm font-bold text-foreground hover:bg-muted/30 transition-colors w-full sm:w-auto"
                >
                  Explore Features
                </a>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Visual Hologram Frame */}
        <div className="lg:col-span-5 relative w-full flex justify-center animate-floating">
          {/* Ambient Glow backing */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-brand-pink/30 blur-3xl -z-10 rounded-full scale-90" />
          
          <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-lg p-3.5 shadow-premium overflow-hidden w-full max-w-md">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/30">
              <img 
                src="/hero_travel_mockup.png" 
                alt="NxtVibes Visual Board Mockup" 
                className="h-full w-full object-cover rounded-2xl hover:scale-105 transition-transform duration-700" 
              />
              {/* Floating glass overlay card */}
              <div className="absolute bottom-3 left-3 right-3 glass-panel p-3 rounded-xl border border-white/10 flex items-center justify-between gap-3 shadow-premium">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center text-success">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black leading-none">Coorg Weekend</h5>
                    <p className="text-[8px] text-muted-foreground mt-1">3 Collaborators Active</p>
                  </div>
                </div>
                <div className="flex -space-x-1.5 overflow-hidden">
                  <span className="h-6 w-6 rounded-full bg-primary/20 border border-background text-[8px] font-bold flex items-center justify-center">A</span>
                  <span className="h-6 w-6 rounded-full bg-secondary/20 border border-background text-[8px] font-bold flex items-center justify-center">B</span>
                  <span className="h-6 w-6 rounded-full bg-accent/20 border border-background text-[8px] font-bold flex items-center justify-center">C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20 relative z-10 border-t border-border/30">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Everything You Need for the Perfect Trip</h2>
          <p className="text-sm text-muted-foreground mt-2">Ditch the mess of tabs, emails, and notes. Sync it all in a unified travel environment.</p>
        </div>

        {/* Feature Grid with details & visual cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Timelines */}
          <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-6 shadow-premium premium-card flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary mb-4 shadow-sm shadow-primary/5">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-base mb-2">Visual Day-by-Day Timeline</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build timelines with drag-and-drop support. Add destinations, schedule visits, input timings, and edit routes instantly with automatic WebSocket synchronization.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-primary uppercase">Explore timelines</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/10">Synchronized</span>
            </div>
          </div>

          {/* Card 2: Collaboration with Image */}
          <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-5 shadow-premium premium-card flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 border border-border/30">
                <img 
                  src="/collaborative_travel_vibes.png" 
                  alt="Friends around a beach campfire" 
                  className="h-full w-full object-cover rounded-2xl" 
                />
              </div>
              <h4 className="font-bold text-base mb-2">Social Trip Collaboration</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add friends to your board. Jointly compile packing checklists, suggest food recommendations, and share direct or group chat logs.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-black text-secondary uppercase">Websockets active</span>
              <span className="text-[10px] bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full font-bold border border-secondary/10">Group Sync</span>
            </div>
          </div>

          {/* Card 3: AI Assistant with Image */}
          <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-5 shadow-premium premium-card flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 border border-border/30">
                <img 
                  src="/ai_travel_assistant.png" 
                  alt="Futuristic AI recommendations interface" 
                  className="h-full w-full object-cover rounded-2xl" 
                />
              </div>
              <h4 className="font-bold text-base mb-2">AI Travel Guide recommendations</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stuck on destinations? Consult the floating AI Travel Assistant drawer to parse web data and inject formatted itinerary details directly.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-black text-accent uppercase">Assistant online</span>
              <span className="text-[10px] bg-accent/10 text-accent px-2.5 py-0.5 rounded-full font-bold border border-accent/10">AI Recommendations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive App Sandbox Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 relative z-10 border-t border-border/30">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-secondary/10 border border-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-bold mb-4">
            Interactive Playground
          </div>
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Experience the Live Workspace</h2>
          <p className="text-sm text-muted-foreground mt-2">Get a hands-on preview of how NxtVibes helps you plan, navigate, communicate, and optimize your trip.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button 
            onClick={() => setActiveDemo("timeline")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeDemo === "timeline" 
                ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]" 
                : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/30"
            }`}
          >
            <Clock className="h-4 w-4" />
            Itinerary Timeline
          </button>
          <button 
            onClick={() => setActiveDemo("map")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeDemo === "map" 
                ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]" 
                : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/30"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Route Mapview
          </button>
          <button 
            onClick={() => setActiveDemo("chats")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeDemo === "chats" 
                ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]" 
                : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/30"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Direct & Group Chats
          </button>
          <button 
            onClick={() => setActiveDemo("ai")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeDemo === "ai" 
                ? "bg-primary text-primary-foreground shadow-glow scale-[1.02]" 
                : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/30"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Travel Assistant
          </button>
        </div>

        {/* Sandbox Content Screen */}
        <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-premium p-6 md:p-8 min-h-[460px] flex flex-col justify-between relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Interactive feedback Toast Notification */}
          {toastMessage && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-success text-success-foreground px-4.5 py-3 shadow-premium text-xs font-bold border border-white/10 animate-bounce">
              <CheckCircle className="h-4 w-4" />
              {toastMessage}
            </div>
          )}

          <div className="flex-1 w-full relative z-10">
            {/* Timeline Demo Screen */}
            {activeDemo === "timeline" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
                  <div>
                    <h4 className="font-extrabold text-lg">Visual Timeline Builder</h4>
                    <p className="text-xs text-muted-foreground">Drag and reorder cards, sync events with your group, and plan day-by-day.</p>
                  </div>
                  <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Day 1 &bull; Coorg Exploration</span>
                </div>

                <div className="relative border-l border-primary/30 ml-4 md:ml-8 pl-6 md:pl-10 space-y-8">
                  {/* Timeline Stop 1 */}
                  <div className="relative group">
                    <span className="absolute -left-[31px] md:-left-[47px] top-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform shadow-glow">1</span>
                    <div className="p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                          <Clock className="h-3.5 w-3.5" />
                          09:00 AM - 10:30 AM
                        </div>
                        <h5 className="font-bold text-sm text-foreground">Drive from Bangalore Airport</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">Pick up self-drive vehicle, grab coffee and light breakfast on highway.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">Transit</span>
                        <span className="text-[10px] bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full font-semibold">Confirmed</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Stop 2 */}
                  <div className="relative group">
                    <span className="absolute -left-[31px] md:-left-[47px] top-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform shadow-glow">2</span>
                    <div className="p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-secondary mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          11:30 AM - 01:00 PM
                        </div>
                        <h5 className="font-bold text-sm text-foreground">Bylakuppe Namdroling Monastery (Golden Temple)</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">Explore the Tibetan settlement, marvel at the 40ft golden Buddha statues.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Spiritual</span>
                        <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-semibold">Pending Review</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Stop 3 */}
                  <div className="relative group">
                    <span className="absolute -left-[31px] md:-left-[47px] top-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-black group-hover:scale-110 transition-transform shadow-glow">3</span>
                    <div className="p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-card transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-pink mb-1">
                          <Clock className="h-3.5 w-3.5" />
                          02:30 PM - 04:30 PM
                        </div>
                        <h5 className="font-bold text-sm text-foreground">Abbey Falls Trek & Sightseeing</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">Walk down the coffee plantations to reach the hanging bridge viewport over Abbey Falls.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">Nature</span>
                        <button 
                          onClick={() => showNotification("Day 1 timeline optimized by AI!")}
                          className="text-[10px] bg-primary text-primary-foreground px-2.5 py-1 rounded-lg font-bold shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          Optimize Path
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mapview Demo Screen */}
            {activeDemo === "map" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
                  <div>
                    <h4 className="font-extrabold text-lg">Interactive GPS Route Map</h4>
                    <p className="text-xs text-muted-foreground">Visualize travel directions, estimate distance, and link details directly to your coordinates.</p>
                  </div>
                  <span className="text-[10px] bg-secondary/15 text-secondary border border-secondary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Trip Route Map</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Route Stats */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm">
                      <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">Distance & Duration</h5>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-2xl font-black bg-gradient-to-r from-primary to-brand-cyan bg-clip-text text-transparent">268 km</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Via NH 75 Route</p>
                        </div>
                        <span className="text-xs font-semibold text-foreground/80">Est: 5 hr 15 min</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 shadow-sm space-y-3">
                      <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Stops on Map</h5>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary text-[10px]">A</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-foreground text-xs">Bangalore (Start)</p>
                          <p className="text-[10px] text-muted-foreground truncate">Kempegowda Int Airport</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="h-6 w-6 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center font-bold text-secondary text-[10px]">B</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-foreground text-xs">Bylakuppe</p>
                          <p className="text-[10px] text-muted-foreground truncate">Namdroling Golden Temple</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="h-6 w-6 rounded-full bg-brand-pink/20 border border-brand-pink/40 flex items-center justify-center font-bold text-brand-pink text-[10px]">C</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-foreground text-xs">Coorg (End)</p>
                          <p className="text-[10px] text-muted-foreground truncate">Abbey Falls / Hotel</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Stylized Visual Map Sandbox */}
                  <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/50 aspect-video relative flex items-center justify-center overflow-hidden min-h-[260px]">
                    {/* Simulated Map Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />
                    
                    {/* Topographic Vector-like curves */}
                    <div className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full border border-primary/10 opacity-20 scale-[1.5]" />
                    <div className="absolute bottom-1/4 right-1/4 w-44 h-44 rounded-full border border-secondary/10 opacity-20 scale-[1.2]" />

                    {/* Animated path line (SVG Drawing) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M 60,180 Q 150,60 240,150 T 400,90" 
                        fill="none" 
                        stroke="url(#map-line-grad)" 
                        strokeWidth="3.5" 
                        strokeDasharray="8 6"
                      />
                      <defs>
                        <linearGradient id="map-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#9d74f7" />
                          <stop offset="50%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Map Marker A */}
                    <div className="absolute left-[52px] top-[168px] group cursor-pointer flex flex-col items-center">
                      <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-xs font-bold text-foreground shadow-glow group-hover:scale-110 transition-transform">A</div>
                      <div className="absolute top-8 bg-card border border-border/60 p-2 rounded-lg text-[9px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Bangalore Starting Point
                      </div>
                    </div>

                    {/* Map Marker B */}
                    <div className="absolute left-[190px] top-[95px] group cursor-pointer flex flex-col items-center">
                      <div className="h-7 w-7 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center text-xs font-bold text-foreground shadow-glow group-hover:scale-110 transition-transform">B</div>
                      <div className="absolute top-8 bg-card border border-border/60 p-2 rounded-lg text-[9px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Bylakuppe Stop (Golden Temple)
                      </div>
                    </div>

                    {/* Map Marker C */}
                    <div className="absolute left-[360px] top-[70px] group cursor-pointer flex flex-col items-center">
                      <div className="h-7 w-7 rounded-full bg-brand-pink/20 border border-brand-pink flex items-center justify-center text-xs font-bold text-foreground shadow-glow group-hover:scale-110 transition-transform">C</div>
                      <div className="absolute top-8 bg-card border border-border/60 p-2 rounded-lg text-[9px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        Coorg Itinerary Destination
                      </div>
                    </div>

                    {/* Stylized Floating controls overlay */}
                    <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 glass-panel p-1.5 rounded-xl border border-white/10 z-20">
                      <button 
                        onClick={() => showNotification("Map center updated to destination.")}
                        className="text-[9px] bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Recenter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chats Demo Screen */}
            {activeDemo === "chats" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
                  <div>
                    <h4 className="font-extrabold text-lg">Real-Time Chat Interface</h4>
                    <p className="text-xs text-muted-foreground">Collaborate on the fly. Share recommendations and keep everybody on the same page.</p>
                  </div>
                  {/* Chat Selector */}
                  <div className="flex gap-1 p-0.5 rounded-xl bg-muted/60 border border-border/30">
                    <button 
                      onClick={() => setChatType("group")}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        chatType === "group" 
                          ? "bg-card text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Group Chat
                    </button>
                    <button 
                      onClick={() => setChatType("direct")}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        chatType === "direct" 
                          ? "bg-card text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Direct (AI Agent)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 border border-border/40 rounded-2xl bg-card/40 overflow-hidden shadow-sm min-h-[300px]">
                  {/* Sidebar Rooms */}
                  <div className="border-r border-border/30 bg-muted/20 p-3 hidden md:block md:col-span-1 space-y-2">
                    <div 
                      onClick={() => setChatType("group")}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        chatType === "group" ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">CS</div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-foreground">Coorg Squad</p>
                        <p className="text-[9px] text-muted-foreground truncate">Rahul: We are ready!</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setChatType("direct")}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                        chatType === "direct" ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-xs">🤖</div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-foreground">Sarah (AI Guide)</p>
                        <p className="text-[9px] text-muted-foreground truncate">I found 3 great cafes...</p>
                      </div>
                    </div>
                  </div>

                  {/* Messaging Area */}
                  <div className="md:col-span-3 flex flex-col justify-between p-4 bg-card/10 min-h-[260px]">
                    <div className="space-y-4 overflow-y-auto max-h-[190px] pr-2">
                      {chatType === "group" ? (
                        <>
                          {/* Message 1 */}
                          <div className="flex gap-2.5 items-start">
                            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/10 flex items-center justify-center text-[10px] font-bold shrink-0">R</div>
                            <div className="rounded-2xl border border-border/40 bg-card/65 px-4 py-2.5 max-w-[80%] text-xs shadow-sm">
                              <p className="font-bold text-[10px] text-primary">Rahul Kumar</p>
                              <p className="text-foreground/80 mt-1">Hey guys! Did anyone book the coffee plantation walk for Day 2?</p>
                              <span className="text-[8px] text-muted-foreground block text-right mt-1.5">02:15 PM</span>
                            </div>
                          </div>

                          {/* Message 2 */}
                          <div className="flex gap-2.5 items-start justify-end">
                            <div className="rounded-2xl border border-white/5 bg-primary px-4 py-2.5 max-w-[80%] text-xs text-primary-foreground shadow-sm">
                              <p className="font-bold text-[10px] text-primary-foreground/90">You</p>
                              <p className="mt-1">Yes, I added it to our checklist on NxtVibes. Sarah (our AI assistant) is helping confirm timing.</p>
                              <span className="text-[8px] opacity-75 block text-right mt-1.5">02:17 PM</span>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-secondary/20 border border-secondary/10 flex items-center justify-center text-[10px] font-bold shrink-0">U</div>
                          </div>

                          {/* Message 3 */}
                          <div className="flex gap-2.5 items-start">
                            <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/10 flex items-center justify-center text-[10px] font-bold shrink-0">K</div>
                            <div className="rounded-2xl border border-border/40 bg-card/65 px-4 py-2.5 max-w-[80%] text-xs shadow-sm">
                              <p className="font-bold text-[10px] text-accent">Karan Johar</p>
                              <p className="text-foreground/80 mt-1">Perfect! Let's check the map to see if we can do Bylakuppe Temple on the way there.</p>
                              <span className="text-[8px] text-muted-foreground block text-right mt-1.5">02:18 PM</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Message 1 */}
                          <div className="flex gap-2.5 items-start">
                            <div className="h-8 w-8 rounded-full bg-secondary/20 border border-secondary/10 flex items-center justify-center text-[10px] font-bold shrink-0">🤖</div>
                            <div className="rounded-2xl border border-border/40 bg-card/65 px-4 py-2.5 max-w-[80%] text-xs shadow-sm">
                              <p className="font-bold text-[10px] text-secondary">Sarah (AI Travel Guide)</p>
                              <p className="text-foreground/80 mt-1">Hello! I found 2 highly-rated coffee plantation tours in Madikeri, Coorg:</p>
                              <ul className="list-disc pl-4 mt-1 space-y-1 text-muted-foreground text-[11px]">
                                <li>Mercara Gold Estate (₹350/person)</li>
                                <li>Coorg Express Walks (₹500/person)</li>
                              </ul>
                              <span className="text-[8px] text-muted-foreground block text-right mt-1.5">01:30 PM</span>
                            </div>
                          </div>

                          {/* Message 2 */}
                          <div className="flex gap-2.5 items-start justify-end">
                            <div className="rounded-2xl border border-white/5 bg-primary px-4 py-2.5 max-w-[80%] text-xs text-primary-foreground shadow-sm">
                              <p className="font-bold text-[10px] text-primary-foreground/90">You</p>
                              <p className="mt-1">Add Mercara Gold Estate to checklist and notify Rahul.</p>
                              <span className="text-[8px] opacity-75 block text-right mt-1.5">01:32 PM</span>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-secondary/20 border border-secondary/10 flex items-center justify-center text-[10px] font-bold shrink-0">U</div>
                          </div>

                          {/* Message 3 */}
                          <div className="flex gap-2.5 items-start">
                            <div className="h-8 w-8 rounded-full bg-secondary/20 border border-secondary/10 flex items-center justify-center text-[10px] font-bold shrink-0">🤖</div>
                            <div className="rounded-2xl border border-border/40 bg-card/65 px-4 py-2.5 max-w-[80%] text-xs shadow-sm">
                              <p className="font-bold text-[10px] text-secondary">Sarah (AI Travel Guide)</p>
                              <p className="text-foreground/80 mt-1">Done! I have added "Book Mercara Gold Tour" to your checklist under the "Day 2 Activities" category.</p>
                              <span className="text-[8px] text-muted-foreground block text-right mt-1.5">01:32 PM</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Chat Input mock */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                      <input 
                        type="text" 
                        placeholder={chatType === "group" ? "Message group..." : "Ask Sarah anything..."}
                        disabled
                        className="flex-1 rounded-xl border border-border/60 bg-input/40 py-2 px-3 text-xs outline-none opacity-80"
                      />
                      <button 
                        onClick={() => showNotification("Register or Login to send actual messages in real-time!")}
                        className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow shrink-0 cursor-pointer hover:opacity-90"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Assistant Demo Screen */}
            {activeDemo === "ai" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
                  <div>
                    <h4 className="font-extrabold text-lg">AI Travel Recommendation Engine</h4>
                    <p className="text-xs text-muted-foreground">Instantly draft plans, check reviews, optimize travel expenses, and discover local spots.</p>
                  </div>
                  <span className="text-[10px] bg-accent/15 text-accent border border-accent/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">AI Copilot</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Prompt Selector list */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Try Prompts</h5>
                    
                    <button 
                      onClick={() => {
                        setAiPromptClicked(true);
                        showNotification("AI is thinking...");
                      }}
                      className="w-full text-left p-3.5 rounded-2xl border border-border/40 bg-card/40 hover:bg-card transition-all text-xs font-semibold cursor-pointer shadow-sm hover:border-primary/30 flex items-center justify-between group"
                    >
                      <span>Suggest Coorg viewpoints during rain</span>
                      <Sparkles className="h-3.5 w-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>

                    <button 
                      onClick={() => {
                        showNotification("Mock Action: Optimized 3-day transit budget to ₹2,500!");
                      }}
                      className="w-full text-left p-3.5 rounded-2xl border border-border/40 bg-card/40 hover:bg-card transition-all text-xs font-semibold cursor-pointer shadow-sm hover:border-primary/30 flex items-center justify-between group"
                    >
                      <span>Optimize route & budget for 3 days</span>
                      <Sparkles className="h-3.5 w-3.5 text-secondary opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>

                    <button 
                      onClick={() => {
                        showNotification("Mock Action: Loaded Coorg coffee estate stays!");
                      }}
                      className="w-full text-left p-3.5 rounded-2xl border border-border/40 bg-card/40 hover:bg-card transition-all text-xs font-semibold cursor-pointer shadow-sm hover:border-primary/30 flex items-center justify-between group"
                    >
                      <span>Recommend local coffee estate stays</span>
                      <Sparkles className="h-3.5 w-3.5 text-accent opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  </div>

                  {/* AI Response Output Block */}
                  <div className="lg:col-span-8 rounded-2xl border border-border/40 bg-card/50 p-5 min-h-[220px] flex flex-col justify-between shadow-sm">
                    {aiPromptClicked ? (
                      <div className="space-y-3.5 text-xs text-foreground/80 leading-relaxed">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <Sparkles className="h-4 w-4" />
                          <span>Sarah (NxtVibes AI Assistant)</span>
                        </div>
                        <p>Here are the best rainy-season recommendations for your Coorg trip plan:</p>
                        
                        <div className="space-y-2.5 pl-2 border-l border-primary/20">
                          <div>
                            <p className="font-bold text-foreground">1. Raja's Seat (Sunset & Fog)</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">High valley sunset viewport. Monsoon rain wraps the mountains in epic mist beds.</p>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">2. Mandalpatti (4x4 Jeep Trail)</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Off-road jeep track. Highly recommended when it drizzles; feels like standing in clouds.</p>
                          </div>
                        </div>

                        <div className="pt-2 flex gap-2 justify-end">
                          <button 
                            onClick={() => {
                              setAiPromptClicked(false);
                              showNotification("Added 2 viewpoints to your itinerary Day 1!");
                            }}
                            className="bg-primary text-primary-foreground text-[10px] font-bold px-3.5 py-2 rounded-xl shadow-glow cursor-pointer hover:opacity-90"
                          >
                            Sync to Board Itinerary
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-75">
                        <div className="h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground mb-3">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold">No Prompt Loaded</p>
                        <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">Click one of the suggested prompts on the left to see the AI Travel Copilot output in action.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to action section */}
      <section className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-lg p-8 md:p-12 shadow-premium text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-brand-pink/10 -z-10" />
          
          <h2 className="text-2xl md:text-3xl font-black">Ready to Start Your Journey?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-3">
            Bring your friends, plan your visual itinerary, and explore new travel vibes today.
          </p>

          <div className="mt-8 flex justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl btn-premium px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-premium"
              >
                Go to Dashboard
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-2xl btn-premium px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-premium"
              >
                Create Free Account
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Premium modern footer */}
      <footer className="w-full border-t border-border/20 bg-background/80 backdrop-blur-md mt-20">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base shadow-glow">
                NV
              </div>
              <span className="font-extrabold text-base tracking-tight">NxtVibes</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time collaboration travel planning web app. Synchronizing plans, schedules, and conversations dynamically.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Features</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Trip Dashboard</Link></li>
              <li><Link href="/itineraries/new" className="hover:text-primary transition-colors">Visual Stepper Wizard</Link></li>
              <li><Link href="/messages" className="hover:text-primary transition-colors">Real-time chat & media</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Integration</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><span className="opacity-80">Supabase DB</span></li>
              <li><span className="opacity-80">Cloudflare Workers</span></li>
              <li><span className="opacity-80">TanStack Query Cache</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Privacy & Terms</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="max-w-6xl mx-auto px-4 py-6 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NxtVibes. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer">Twitter</span>
            <span className="hover:text-foreground cursor-pointer">Instagram</span>
            <span className="hover:text-foreground cursor-pointer">GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

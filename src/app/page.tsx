"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin, MessageSquare, ArrowRight, Sparkles, CheckCircle,
  Clock, Check, Sun, Moon, Copy, Mail, Camera,
  Smartphone, Smile, Compass, Share2, Layers, CheckSquare,
  Users, Globe, Send, ChevronRight, ChevronLeft, Play, Zap
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/store/themeStore";

/* ─── Types ─── */
interface Message {
  id: number;
  sender: string;
  text: string;
  initial: string;
  isSelf?: boolean;
}

/* ─── Reusable Scroll-Reveal Wrapper ─── */
function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 40 : 0,
      x: direction === "left" ? -40 : direction === "right" ? 40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
export default function Home() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<"timeline" | "map" | "chat" | "scan">("timeline");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Waitlist
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistError, setWaitlistError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  // Contact
  const [copied, setCopied] = useState(false);

  // Header scroll state
  const [scrolled, setScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Interactive Playground: Checklist
  const [tasks, setTasks] = useState([
    { id: 1, text: "Book self-drive rental car", done: true },
    { id: 2, text: "Confirm Namdroling Monastery timings", done: false },
    { id: 3, text: "Check-in package at Coorg Resort", done: false },
    { id: 4, text: "Reserve Mercara Gold coffee walk", done: false },
  ]);

  // Interactive Playground: Map
  const [activeStop, setActiveStop] = useState<"A" | "B" | "C">("B");

  // Interactive Playground: Chat
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "Rahul", text: "Hey! Did we confirm the Golden Temple stop for Day 1?", initial: "R" },
    { id: 2, sender: "Karan", text: "Yes, just added it on the board timeline at 11:30 AM.", initial: "K" },
    { id: 3, sender: "Sneha", text: "Nice! What time are we hitting Abbey Falls?", initial: "S" },
    { id: 4, sender: "Karan", text: "Probably around 3:00 PM so we get good lighting for photos!", initial: "K" },
    { id: 5, sender: "You", text: "Awesome. Let's make sure we leave by 2:00 PM then.", initial: "U", isSelf: true },
  ]);
  const [inputMsg, setInputMsg] = useState("");

  // Interactive Playground: Face Scanner
  const [faceStep, setFaceStep] = useState<"upload_dump" | "upload_face" | "ready_to_scan" | "scanning" | "completed">("upload_dump");
  const photos = [
    { id: 1, name: "Monastery Selfie", type: "Monastery", hasUserFace: true, color: "from-purple-500/20 to-blue-500/20" },
    { id: 2, name: "Group Dinner", type: "Coorg Town", hasUserFace: true, color: "from-rose-500/20 to-orange-500/20" },
    { id: 3, name: "Trekking Path", type: "Abbey Falls", hasUserFace: false, color: "from-emerald-500/20 to-teal-500/20" },
    { id: 4, name: "Sunset View", type: "Raja Seat", hasUserFace: false, color: "from-amber-500/20 to-red-500/20" },
    { id: 5, name: "Coffee Walk", type: "Madikeri", hasUserFace: true, color: "from-indigo-500/20 to-cyan-500/20" },
    { id: 6, name: "Waterfall Stop", type: "Abbey Falls", hasUserFace: false, color: "from-purple-500/20 to-emerald-500/20" },
  ];

  // ─── Effects ───
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchWaitlistCount();
  }, []);

  // ─── Handlers ───
  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchWaitlistCount = async () => {
    try {
      const { data, error } = await supabase.rpc("get_waitlist_count");
      if (error) throw error;
      if (data !== null) setWaitlistCount(Number(data));
    } catch (err) {
      console.error("Error fetching waitlist count:", err);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes("@")) {
      setWaitlistStatus("error");
      setWaitlistError("Please enter a valid email address.");
      return;
    }
    setWaitlistStatus("loading");
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email: waitlistEmail.trim().toLowerCase() }]);

      if (error) {
        if (error.code === "23505") {
          setWaitlistStatus("success");
          showNotification("You're already on the waitlist! 🎉");
        } else {
          throw error;
        }
      } else {
        setWaitlistStatus("success");
        showNotification("Welcome to the waitlist! 🎉");
        fetchWaitlistCount();
      }
    } catch (err: any) {
      console.error("Waitlist error:", err);
      setWaitlistStatus("error");
      setWaitlistError(err.message || "Failed to join. Please try again.");
    }
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("nxtvibes.app@gmail.com");
    setCopied(true);
    showNotification("Email copied to clipboard! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleSendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const newMsg: Message = {
      id: messages.length + 1,
      sender: "You",
      text: inputMsg.trim(),
      initial: "U",
      isSelf: true,
    };
    setMessages([...messages, newMsg]);
    setInputMsg("");
  };

  const handleUploadDump = () => {
    setFaceStep("upload_face");
    showNotification("15 trip photos uploaded successfully! 📸");
  };

  const handleUploadFace = () => {
    setFaceStep("ready_to_scan");
    showNotification("Face photo uploaded successfully! 👤");
  };

  const startFaceScan = () => {
    setFaceStep("scanning");
    setTimeout(() => {
      setFaceStep("completed");
      showNotification("AI Face-Scan sorted! Found 3 matching photos.");
    }, 2500);
  };

  const resetFaceScan = () => {
    setFaceStep("upload_dump");
  };

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  const totalWaitlist = waitlistCount !== null ? 150 + waitlistCount : 150;

  const tabItems = [
    { key: "timeline" as const, label: "Timeline", icon: Clock, color: "text-primary" },
    { key: "map" as const, label: "Map View", icon: MapPin, color: "text-secondary" },
    { key: "chat" as const, label: "Group Chat", icon: MessageSquare, color: "text-brand-pink" },
    { key: "scan" as const, label: "Face Scan", icon: Camera, color: "text-brand-cyan" },
  ];

  const marqueeItems = [
    "Real-time collaboration",
    "Day-wise itineraries",
    "Google Maps integration",
    "Shared checklists",
    "Group & direct chats",
    "AI trip planning",
    "Face-scan photo matching",
    "Split bills with friends",
    "Share to WhatsApp",
    "Invite collaborators",
  ];

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden transition-colors duration-300">
      {/* Grain Texture */}
      <div className="grain-overlay" />

      {/* Floating Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] flex items-center gap-2.5 rounded-2xl bg-foreground text-background px-5 py-3 shadow-2xl text-sm font-semibold"
          >
            <CheckCircle className="h-4 w-4 text-success shrink-0" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HEADER ─── */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/30 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-pink text-white font-extrabold text-sm shadow-lg">
              NV
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              NxtVibes
            </span>
          </div>

          <nav className="flex items-center gap-2 md:gap-5">
            <a href="#features" className="hidden sm:block text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#roadmap" className="hidden sm:block text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Roadmap
            </a>
            <a href="#contact" className="hidden sm:block text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>

            <div className="h-4 w-px bg-border/40 hidden sm:block" />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-muted/60 text-foreground/70 hover:text-foreground transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <a
              href="#waitlist"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Join Beta
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section id="waitlist" className="relative pt-32 md:pt-44 pb-20 px-5 bg-[radial-gradient(circle_at_20%_25%,rgba(157,116,247,0.03),transparent_50%),radial-gradient(circle_at_80%_55%,rgba(236,72,153,0.03),transparent_50%)]">

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <Reveal className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-muted/60 border border-border/50 text-muted-foreground px-4 py-2 rounded-full text-[13px] font-medium mb-8 mx-auto">
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              Building the future of group travel planning
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black tracking-[-0.03em] leading-[1.05] text-foreground max-w-3xl mx-auto text-center">
              Your WhatsApp group
              <br />
              <span className="text-muted-foreground/40">is not a</span>{" "}
              <span className="bg-gradient-to-r from-primary via-brand-pink to-secondary bg-clip-text text-transparent">
                travel planner.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mt-6 leading-relaxed font-light mx-auto text-center">
              Itineraries, maps, checklists, and squad chat — finally in one place.
              Stop scrolling through 400 unread messages to find the hotel address.
            </p>
          </Reveal>

          {/* Waitlist Form */}
          <Reveal delay={0.3}>
            <div className="mt-10 w-full max-w-lg mx-auto flex flex-col items-center">
              {waitlistStatus === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl border border-success/30 bg-success/5 text-success flex items-center gap-3 w-full text-left"
                >
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">You're on the list!</p>
                    <p className="text-xs opacity-80 mt-0.5">We'll send early access to <strong>{waitlistEmail}</strong></p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="w-full">
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <input
                      type="email"
                      placeholder="Enter your email..."
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      disabled={waitlistStatus === "loading"}
                      className="flex-1 px-5 py-3.5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 outline-none text-[15px] focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={waitlistStatus === "loading"}
                      className="flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-7 py-3.5 text-[15px] font-semibold cursor-pointer disabled:opacity-50 shrink-0 hover:opacity-90 transition-all active:scale-[0.98]"
                    >
                      {waitlistStatus === "loading" ? (
                        <>
                          <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          Join the Waitlist
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                  {waitlistStatus === "error" && (
                    <p className="text-xs text-destructive font-medium mt-2 ml-1 text-left">{waitlistError}</p>
                  )}
                </form>
              )}

              {/* Social proof */}
              <div className="flex items-center justify-center gap-3 mt-6 mx-auto">
                <div className="flex -space-x-2">
                  {["bg-primary/25", "bg-secondary/25", "bg-brand-pink/25", "bg-accent/25"].map(
                    (bg, i) => (
                      <div
                        key={i}
                        className={`h-7 w-7 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[9px] font-bold text-foreground/60`}
                      >
                        {["A", "K", "R", "S"][i]}
                      </div>
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">
                    <AnimatedCounter target={totalWaitlist} suffix="+" />
                  </strong>{" "}
                  travel squads waiting
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── MARQUEE TICKER ─── */}
      <section className="w-full border-y border-border/30 py-4 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 mx-6 text-sm text-muted-foreground/70 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ─── INTERACTIVE PRODUCT DEMO ─── */}
      <section className="max-w-5xl mx-auto px-5 py-24">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-[13px] font-semibold text-primary uppercase tracking-widest mb-3">
              Interactive Preview
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              See it in action
            </h2>
            <p className="text-muted-foreground mt-3 text-base max-w-lg mx-auto">
              This isn't a mockup. Click around, type messages, toggle tasks — everything here is live.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm shadow-premium overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-muted/25 border-b border-border/20 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-400/70" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
                </div>
                <div className="hidden sm:flex items-center gap-2 ml-3 px-3 py-1 rounded-lg bg-background/50 border border-border/20">
                  <Globe className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground/60 font-mono">
                    nxtvibes.app/boards/coorg-trip-2026
                  </span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl">
                {tabItems.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className={`h-3 w-3 ${activeTab === tab.key ? tab.color : ""}`} />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8 min-h-[400px] relative">
              <AnimatePresence mode="wait">
                {/* ── TIMELINE TAB ── */}
                {activeTab === "timeline" && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <Clock className="h-4.5 w-4.5 text-primary" />
                          Day 1 — Bangalore → Coorg
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click tasks to mark them complete. Changes sync to all collaborators.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                          4 stops planned
                        </span>
                        <div className="flex -space-x-1.5">
                          <div className="h-6 w-6 rounded-full bg-primary/20 border-2 border-background text-[8px] font-bold flex items-center justify-center">R</div>
                          <div className="h-6 w-6 rounded-full bg-secondary/20 border-2 border-background text-[8px] font-bold flex items-center justify-center">K</div>
                          <div className="h-6 w-6 rounded-full bg-brand-pink/20 border-2 border-background text-[8px] font-bold flex items-center justify-center">U</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Timeline Stops */}
                      <div className="lg:col-span-5 relative border-l-2 border-primary/20 ml-3 pl-6 space-y-5">
                        {[
                          { num: 1, time: "06:00 AM", title: "Bangalore Airport", desc: "Pick up rental car, load luggage", color: "primary" },
                          { num: 2, time: "11:30 AM", title: "Golden Temple, Bylakuppe", desc: "Tibetan monastery & cultural walk", color: "secondary" },
                          { num: 3, time: "03:30 PM", title: "Abbey Falls Nature Stop", desc: "1.5km trek + waterfall viewpoint", color: "brand-pink" },
                        ].map((stop) => (
                          <div key={stop.num} className="relative group">
                            <span className={`absolute -left-[27px] top-1 h-4 w-4 rounded-full bg-background border-[2.5px] border-${stop.color} transition-transform group-hover:scale-110`} />
                            <div>
                              <span className={`text-[10px] bg-${stop.color}/10 text-${stop.color} px-2 py-0.5 rounded-full font-semibold`}>
                                {stop.time}
                              </span>
                              <h5 className="font-bold text-sm mt-1.5">{stop.title}</h5>
                              <p className="text-xs text-muted-foreground mt-0.5">{stop.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Checklist */}
                      <div className="lg:col-span-7 bg-muted/15 border border-border/20 rounded-2xl p-5 space-y-3">
                        <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-primary" />
                          Shared Checklist
                        </h5>
                        <div className="space-y-2">
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => toggleTask(task.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                task.done
                                  ? "border-success/20 bg-success/[0.03]"
                                  : "border-border/20 bg-background/50 hover:bg-background/80"
                              }`}
                            >
                              <div
                                className={`h-4.5 w-4.5 rounded-md border-2 flex items-center justify-center transition-all ${
                                  task.done
                                    ? "bg-success border-success text-white"
                                    : "border-border/50"
                                }`}
                              >
                                {task.done && <Check className="h-3 w-3" />}
                              </div>
                              <span
                                className={`text-sm ${
                                  task.done ? "line-through text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── MAP TAB ── */}
                {activeTab === "map" && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <MapPin className="h-4.5 w-4.5 text-secondary" />
                          Route Overview
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click a stop to focus the map. Every timeline stop auto-pins here.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                      <div className="lg:col-span-4 space-y-2">
                        {[
                          { key: "A" as const, title: "Bangalore Airport", sub: "Starting point", color: "primary", dist: "0 km" },
                          { key: "B" as const, title: "Golden Temple", sub: "Bylakuppe, 218km", color: "secondary", dist: "218 km" },
                          { key: "C" as const, title: "Abbey Falls", sub: "Nature trail, 268km", color: "brand-pink", dist: "268 km" },
                        ].map((stop) => (
                          <button
                            key={stop.key}
                            onClick={() => setActiveStop(stop.key)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              activeStop === stop.key
                                ? `border-${stop.color}/40 bg-${stop.color}/5`
                                : "border-border/20 bg-card/30 hover:bg-card/60"
                            }`}
                          >
                            <div className={`h-7 w-7 rounded-full bg-${stop.color}/15 text-${stop.color} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                              {stop.key}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs">{stop.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{stop.sub}</p>
                            </div>
                            {activeStop === stop.key && (
                              <span className={`text-[9px] bg-${stop.color}/10 text-${stop.color} px-2 py-0.5 rounded-full font-semibold`}>
                                {stop.dist}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Map Visual */}
                      <div className="lg:col-span-8 rounded-2xl border border-border/20 bg-card/15 relative overflow-hidden min-h-[320px]">
                        <iframe
                          width="100%"
                          height="100%"
                          className="absolute inset-0 border-0 w-full h-full opacity-85 dark:opacity-75"
                          style={{ filter: isDarkMode ? "invert(90%) hue-rotate(180deg)" : "none" }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(
                            activeStop === "A"
                              ? "Kempegowda International Airport Bengaluru"
                              : activeStop === "B"
                              ? "Namdroling Monastery Golden Temple Bylakuppe"
                              : "Abbey Falls Coorg"
                          )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                        />

                        {/* HUD */}
                        <div className="absolute bottom-3 left-3 right-3 glass-panel rounded-xl p-3 flex items-center justify-between z-10 shadow-lg">
                          <div>
                            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Active Stop</p>
                            <p className="font-semibold text-xs mt-0.5">
                              {activeStop === "A" && "Bangalore Airport"}
                              {activeStop === "B" && "Golden Temple, Bylakuppe"}
                              {activeStop === "C" && "Abbey Falls Nature Trek"}
                            </p>
                          </div>
                          <span className="text-[10px] bg-secondary/10 text-secondary px-2.5 py-1 rounded-lg font-semibold">
                            {activeStop === "A" && "Start"}
                            {activeStop === "B" && "218 km"}
                            {activeStop === "C" && "268 km"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── CHAT TAB ── */}
                {activeTab === "chat" && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <MessageSquare className="h-4.5 w-4.5 text-brand-pink" />
                          Group Chat
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Discuss with your friends in real-time to decide where and when to go.
                        </p>
                      </div>
                      <span className="text-[11px] bg-success/10 text-success px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        3 online
                      </span>
                    </div>

                    <div className="border border-border/20 rounded-2xl bg-card/20 p-5 flex flex-col min-h-[300px]">
                      <div className="space-y-3 overflow-y-auto max-h-[220px] pr-2 flex-1">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-2.5 items-start ${msg.isSelf ? "justify-end" : "justify-start"}`}
                          >
                            {!msg.isSelf && (
                              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center font-semibold text-[10px] shrink-0 text-primary">
                                {msg.initial}
                              </div>
                            )}
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl max-w-[70%] ${
                                msg.isSelf
                                  ? "bg-foreground text-background rounded-br-md"
                                  : "bg-muted/30 border border-border/15 rounded-bl-md"
                              }`}
                            >
                              {!msg.isSelf && (
                                <p className="font-semibold text-[10px] text-muted-foreground mb-0.5">{msg.sender}</p>
                              )}
                              <p className="text-[13px] leading-relaxed">{msg.text}</p>
                            </div>
                            {msg.isSelf && (
                              <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center font-semibold text-[10px] shrink-0">
                                {msg.initial}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleSendMsg} className="flex items-center gap-2 mt-4 pt-3 border-t border-border/15">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          value={inputMsg}
                          onChange={(e) => setInputMsg(e.target.value)}
                          className="flex-1 rounded-xl border border-border/30 bg-background/50 py-2.5 px-4 text-sm outline-none focus:border-primary/40 transition-colors"
                        />
                        <button
                          type="submit"
                          className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* ── FACE SCAN TAB ── */}
                {activeTab === "scan" && (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <Camera className="h-4.5 w-4.5 text-brand-cyan" />
                          AI Photo Matcher
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Scan your face to find your photos from the group dump instantly.
                        </p>
                      </div>
                      <span className="text-[11px] bg-brand-cyan/10 text-brand-cyan px-3 py-1 rounded-full font-semibold">
                        Phase 3 Preview
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-5 bg-muted/15 border border-border/20 rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
                        <div>
                          <span className="text-[10px] bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-md font-mono uppercase font-semibold">
                            {faceStep === "upload_dump" && "Step 1 of 3"}
                            {faceStep === "upload_face" && "Step 2 of 3"}
                            {faceStep === "ready_to_scan" && "Step 3 of 3"}
                            {faceStep === "scanning" && "Running AI"}
                            {faceStep === "completed" && "Finished"}
                          </span>
                          <h5 className="font-bold text-base mt-2.5 mb-2">
                            {faceStep === "upload_dump" && "Upload Trip Photos"}
                            {faceStep === "upload_face" && "Upload Face Photo"}
                            {faceStep === "ready_to_scan" && "Ready to Scan"}
                            {faceStep === "scanning" && "Matching Faces..."}
                            {faceStep === "completed" && "Matches Found!"}
                          </h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {faceStep === "upload_dump" && "First, upload the shared photo dump containing all the photos clicked by everyone during the trip."}
                            {faceStep === "upload_face" && "Upload a clear photo of your face or take a quick selfie. The AI will search the trip dump for matches."}
                            {faceStep === "ready_to_scan" && "Ready! NxtVibes AI will search the trip photos, match your face, and separate your photos instantly."}
                            {faceStep === "scanning" && "Generating facial recognition signature and scanning matching images from the trip dump..."}
                            {faceStep === "completed" && "AI found 3 photos featuring your face! Download link generated below for your curated album."}
                          </p>
                        </div>

                        <div className="mt-5">
                          {faceStep === "upload_dump" && (
                            <button
                              onClick={handleUploadDump}
                              className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-semibold py-3 rounded-xl text-xs cursor-pointer hover:opacity-90 transition-all active:scale-[0.98]"
                            >
                              <Layers className="h-4 w-4" />
                              Upload Group Dump (15 Photos)
                            </button>
                          )}

                          {faceStep === "upload_face" && (
                            <button
                              onClick={handleUploadFace}
                              className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-semibold py-3 rounded-xl text-xs cursor-pointer hover:opacity-90 transition-all active:scale-[0.98]"
                            >
                              <Smile className="h-4 w-4" />
                              Upload Your Selfie
                            </button>
                          )}

                          {faceStep === "ready_to_scan" && (
                            <button
                              onClick={startFaceScan}
                              className="w-full flex items-center justify-center gap-2 bg-brand-cyan text-background font-semibold py-3 rounded-xl text-xs cursor-pointer hover:opacity-90 transition-all active:scale-[0.98] shadow-glow"
                            >
                              <Play className="h-4 w-4" />
                              Start AI Face Search
                            </button>
                          )}

                          {faceStep === "scanning" && (
                            <div className="w-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-xl py-3 text-center text-xs font-semibold animate-pulse">
                              Searching through 15 photos...
                            </div>
                          )}

                          {faceStep === "completed" && (
                            <div className="space-y-2">
                              <div className="p-3 rounded-xl bg-success/10 border border-success/25 text-success text-xs font-semibold flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                Album ready: 3 matching photos!
                              </div>
                              <button
                                onClick={resetFaceScan}
                                className="w-full border border-border/40 bg-card/50 font-semibold py-2 rounded-xl text-xs hover:bg-muted/40 cursor-pointer transition-colors"
                              >
                                Reset & Scan Again
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-7 bg-card/15 border border-border/20 rounded-2xl p-4 relative overflow-hidden min-h-[250px] flex items-center justify-center">
                        {faceStep === "scanning" && (
                          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-primary via-brand-pink to-brand-cyan animate-scanningLine z-30" />
                        )}
                        
                        {faceStep === "upload_dump" ? (
                          <div className="text-center p-6 space-y-3">
                            <div className="h-12 w-12 rounded-full border border-dashed border-border flex items-center justify-center mx-auto text-muted-foreground/40">
                              <Layers className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold">Group Dump Empty</p>
                              <p className="text-[10px] text-muted-foreground mt-1">Upload files on the left to populate the sandbox</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                            {photos.map((photo) => {
                              const isMatch = photo.hasUserFace && faceStep === "completed";
                              const isMuted = !photo.hasUserFace && faceStep === "completed";
                              return (
                                <motion.div
                                  key={photo.id}
                                  animate={{
                                    opacity: isMuted ? 0.35 : 1,
                                    scale: isMatch ? 1.03 : isMuted ? 0.96 : 1,
                                  }}
                                  transition={{ duration: 0.4 }}
                                  className={`aspect-[4/3] rounded-xl border p-3 flex flex-col justify-between bg-gradient-to-tr ${photo.color} relative ${
                                    isMatch ? "ring-2 ring-brand-cyan border-brand-cyan/40" : "border-border/15"
                                  }`}
                                >
                                  {isMatch && (
                                    <div className="absolute top-1.5 right-1.5 bg-brand-cyan text-white p-0.5 rounded-full z-10">
                                      <Check className="h-2.5 w-2.5" />
                                    </div>
                                  )}
                                  <span className="text-[8px] bg-background/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md font-mono uppercase font-semibold text-muted-foreground self-start">
                                    {photo.type}
                                  </span>
                                  <div>
                                    <p className="text-[10px] font-semibold truncate">{photo.name}</p>
                                    {isMatch && (
                                      <span className="text-[8px] text-brand-cyan font-bold block mt-0.5 hover:underline cursor-pointer">
                                        Download
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── FEATURES — Horizontal Scroll Carousel ─── */}
      <section id="features" className="py-24 border-t border-border/10 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-5 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <Reveal className="max-w-lg">
            <p className="text-[13px] font-semibold text-primary uppercase tracking-widest mb-3">
              Product Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Curated for the perfect trip
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              Swipe or use navigation controls to explore the core pillars of NxtVibes.
            </p>
          </Reveal>

          {/* Navigation Controls */}
          <Reveal className="flex items-center gap-3 self-start md:self-auto" delay={0.1}>
            <button
              onClick={handleScrollLeft}
              className="h-11 w-11 rounded-full border border-border/40 bg-card/45 hover:bg-muted/80 text-foreground flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleScrollRight}
              className="h-11 w-11 rounded-full border border-border/40 bg-card/45 hover:bg-muted/80 text-foreground flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </Reveal>
        </div>

        {/* Horizontal scrollable row */}
        <div className="relative w-full">
          {/* Edge fade overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-8 md:px-24 snap-x snap-mandatory scroll-smooth"
          >
            {[
              {
                title: "Real-time collaboration",
                desc: "Invite your squad and plan together. Everyone sees updates instantly with zero lag or desync.",
                icon: Users,
                phase: "Phase 1",
                bgClass: "bg-primary/10",
                textClass: "text-primary"
              },
              {
                title: "Day-wise itineraries",
                desc: "Organize stops into elegant, drag-and-drop daily schedules. Set clear timestamps and notes.",
                icon: Compass,
                phase: "Phase 1",
                bgClass: "bg-secondary/10",
                textClass: "text-secondary"
              },
              {
                title: "Google Maps integration",
                desc: "Every itinerary stop auto-pins on a shared map view. View optimal routes and travel distances.",
                icon: MapPin,
                phase: "Phase 1",
                bgClass: "bg-brand-pink/10",
                textClass: "text-brand-pink"
              },
              {
                title: "Shared checklists",
                desc: "Collaborative checklists per stop. Stay aligned on flight check-ins, tickets, and packing lists.",
                icon: CheckSquare,
                phase: "Phase 1",
                bgClass: "bg-accent/10",
                textClass: "text-accent"
              },
              {
                title: "Group & direct chats",
                desc: "Native chat threads built directly alongside the planning boards. Ditch the WhatsApp chaos.",
                icon: MessageSquare,
                phase: "Phase 1",
                bgClass: "bg-success/10",
                textClass: "text-success"
              },
              {
                title: "AI trip planning",
                desc: "Generate full, personalized travel plans and weather-optimized schedules with a single prompt.",
                icon: Sparkles,
                phase: "Phase 2",
                bgClass: "bg-secondary/10",
                textClass: "text-secondary"
              },
              {
                title: "Face-scan photo matching",
                desc: "Upload all trip photos, upload a selfie, and let AI automatically separate and sort everyone's photos.",
                icon: Camera,
                phase: "Phase 3",
                bgClass: "bg-brand-cyan/10",
                textClass: "text-brand-cyan"
              }
            ].map((feat) => (
              <div
                key={feat.title}
                className="w-[280px] md:w-[320px] shrink-0 snap-center rounded-2xl border border-border/30 bg-card/45 backdrop-blur-md p-7 hover:border-primary/25 hover:translate-y-[-4px] transition-all group relative overflow-hidden flex flex-col justify-between min-h-[260px]"
              >
                <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-foreground/[0.01] rounded-full blur-2xl group-hover:bg-foreground/[0.03] transition-colors pointer-events-none" />
                <div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-6 ${feat.bgClass} ${feat.textClass}`}>
                    <feat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base mb-2 text-foreground group-hover:text-primary transition-colors">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/10 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">Features</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${feat.bgClass} ${feat.textClass}`}>
                    {feat.phase}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROADMAP ─── */}
      <section id="roadmap" className="max-w-4xl mx-auto px-5 py-24">
        <Reveal>
          <div className="max-w-lg mb-16">
            <p className="text-[13px] font-semibold text-primary uppercase tracking-widest mb-3">
              Product Roadmap
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Where we're headed
            </h2>
            <p className="text-muted-foreground mt-3 text-base">
              A phased rollout — shipping what matters first, then leveling up.
            </p>
          </div>
        </Reveal>

        <div className="space-y-6">
          {[
            {
              phase: "Phase 1",
              title: "Foundation",
              status: "Live Soon",
              statusColor: "text-success bg-success/10",
              dotColor: "bg-success",
              borderColor: "border-success/30 hover:border-success/50",
              icon: Compass,
              iconColor: "bg-primary/10 text-primary",
              items: [
                { label: "Direct & Group Chats", desc: "Real-time messaging alongside your trip board" },
                { label: "Custom Day-Wise Itineraries", desc: "Build, edit, and reorder timeline stops collaboratively" },
                { label: "Checklists & Notes", desc: "Add tasks and notes under each stop" },
                { label: "Google Maps Integration", desc: "Auto-pin every stop on a shared map view" },
                { label: "Collaborators & Sharing", desc: "Invite friends, share to WhatsApp & other apps" },
              ],
            },
            {
              phase: "Phase 2",
              title: "AI Intelligence",
              status: "In Pipeline",
              statusColor: "text-secondary bg-secondary/10",
              dotColor: "bg-secondary",
              borderColor: "border-secondary/20 hover:border-secondary/40",
              icon: Sparkles,
              iconColor: "bg-secondary/10 text-secondary",
              items: [
                { label: "AI Itinerary Generation", desc: "Generate full day-by-day plans from a single prompt" },
                { label: "AI Trip Recommendations", desc: "Weather-aware routing and budget-optimized suggestions" },
              ],
            },
            {
              phase: "Phase 3",
              title: "Social & Expenses",
              status: "Future",
              statusColor: "text-brand-pink bg-brand-pink/10",
              dotColor: "bg-brand-pink",
              borderColor: "border-brand-pink/20 hover:border-brand-pink/40",
              icon: Camera,
              iconColor: "bg-brand-pink/10 text-brand-pink",
              items: [
                { label: "Split Bills", desc: "Transparent expense ledger to divide costs among the squad" },
                { label: "Photo Dump Rooms", desc: "Upload and share high-res trip photos in one place" },
                { label: "AI Face-Scan Photo Sort", desc: "Scan your face to isolate and download your photos" },
              ],
            },
            {
              phase: "Phase 4",
              title: "Native Mobile",
              status: "Horizon",
              statusColor: "text-brand-cyan bg-brand-cyan/10",
              dotColor: "bg-brand-cyan",
              borderColor: "border-brand-cyan/20 hover:border-brand-cyan/40",
              icon: Smartphone,
              iconColor: "bg-brand-cyan/10 text-brand-cyan",
              items: [
                { label: "Android App Launch", desc: "Full-featured native app on Google Play Store" },
                { label: "iOS App Launch", desc: "Followed by Apple App Store deployment" },
              ],
            },
          ].map((phase, idx) => (
            <Reveal key={phase.phase} delay={idx * 0.08}>
              <div className={`rounded-2xl border ${phase.borderColor} bg-card/20 backdrop-blur-sm p-6 md:p-7 transition-all`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl ${phase.iconColor} flex items-center justify-center`}>
                      <phase.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">
                        <span className="text-muted-foreground font-medium">{phase.phase}:</span>{" "}
                        {phase.title}
                      </h3>
                    </div>
                  </div>
                  <span className={`text-[11px] ${phase.statusColor} px-3 py-1 rounded-full font-semibold self-start flex items-center gap-1.5`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${phase.dotColor}`} />
                    {phase.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                  {phase.items.map((item) => (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA + CONTACT ─── */}
      <section id="contact" className="max-w-4xl mx-auto px-5 py-24">
        <Reveal>
          <div className="rounded-3xl border border-border/30 bg-card/20 backdrop-blur-sm p-10 md:p-16 text-center relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-brand-pink/[0.03] pointer-events-none" />

            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight relative">
              Ready to ditch the chaos?
            </h2>
            <p className="text-muted-foreground mt-4 text-base max-w-md mx-auto relative">
              Join the waitlist for early access. Or just say hi — we read every email.
            </p>

            {/* Waitlist Duplicate */}
            <div className="mt-8 max-w-md mx-auto relative">
              {waitlistStatus === "success" ? (
                <div className="p-4 rounded-2xl border border-success/30 bg-success/5 text-success text-sm font-semibold flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  You're on the waitlist!
                </div>
              ) : (
                <form
                  onSubmit={handleJoinWaitlist}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    disabled={waitlistStatus === "loading"}
                    className="flex-1 px-5 py-3.5 rounded-xl border border-border/40 bg-background/50 text-foreground placeholder:text-muted-foreground/60 outline-none text-[15px] focus:border-primary/50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={waitlistStatus === "loading"}
                    className="flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-3.5 text-[15px] font-semibold cursor-pointer disabled:opacity-50 shrink-0 hover:opacity-90 transition-all"
                  >
                    {waitlistStatus === "loading" ? "Joining..." : "Join Waitlist"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Contact Email */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <div className="flex items-center gap-3 border border-border/40 bg-background/40 rounded-xl px-4 py-2.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground select-all">nxtvibes.app@gmail.com</span>
                <button
                  onClick={copyEmailToClipboard}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Copy"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <a
                href="mailto:nxtvibes.app@gmail.com"
                className="flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Send Email
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="w-full border-t border-border/20 bg-background/80 backdrop-blur-md mt-10">
        <div className="max-w-6xl mx-auto px-5 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-pink text-white font-bold text-xs">
                NV
              </div>
              <span className="font-bold text-base tracking-tight">NxtVibes</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Collaborative trip planning for squads who actually travel together.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Roadmap</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#roadmap" className="hover:text-foreground transition-colors">Phase 1: Foundation</a></li>
              <li><a href="#roadmap" className="hover:text-foreground transition-colors">Phase 2: AI Planner</a></li>
              <li><a href="#roadmap" className="hover:text-foreground transition-colors">Phase 3: Social</a></li>
              <li><a href="#roadmap" className="hover:text-foreground transition-colors">Phase 4: Mobile</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Support</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:nxtvibes.app@gmail.com" className="hover:text-foreground transition-colors">Contact Email</a></li>
              <li><a href="#waitlist" className="hover:text-foreground transition-colors">Join Waitlist</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Legal</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 py-5 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NxtVibes. All rights reserved.</p>
          <div className="flex gap-5">
            <span className="hover:text-foreground cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Instagram</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

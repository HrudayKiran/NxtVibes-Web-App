"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X, Send, User, ChevronRight, Copy, Terminal, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { workersApi } from "@/lib/workersApi";
import { useItineraryStore } from "@/store/itineraryStore";
import { useToast } from "@/components/ui/toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  suggestions?: string[];
};

export const AIAssistantDrawer = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { setTripDraft } = useItineraryStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hide on auth pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  // Create conversation if it doesn't exist
  const ensureConversation = async (firstMsgText: string) => {
    if (conversationId) return conversationId;
    try {
      const title = firstMsgText.length > 25 ? firstMsgText.substring(0, 25) + "..." : firstMsgText;
      const res = await workersApi("/ai/conversations", {
        method: "POST",
        body: { title, model: "llama-3.3-70b-versatile" },
      });
      if (res && res.id) {
        setConversationId(res.id);
        return res.id as string;
      }
    } catch (err) {
      console.error("Failed to create AI conversation:", err);
    }
    return null;
  };

  const handleSend = async (e?: React.FormEvent, textToOverride?: string) => {
    if (e) e.preventDefault();
    const text = (textToOverride || inputText).trim();
    if (!text) return;

    setInputText("");
    const userMsg: AIMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 1. Get or create conversation ID
      const activeConvId = await ensureConversation(text);

      if (activeConvId) {
        // 2. Post message to Workers API D1 backing
        const res = await workersApi(`/ai/conversations/${activeConvId}/messages`, {
          method: "POST",
          body: {
            text,
            model: "llama-3.3-70b-versatile",
          },
        });

        if (res && res.aiMessage) {
          const aiMsg: AIMessage = {
            id: res.aiMessage.id,
            role: "assistant",
            content: res.aiMessage.content,
            created_at: res.aiMessage.created_at,
            suggestions: res.aiMessage.suggestions || [],
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } else {
        // Fallback stateless chat API
        const res = await workersApi("/ai/plan", {
          method: "POST",
          body: {
            text,
            model: "llama-3.3-70b-versatile",
          },
        });
        const aiMsg: AIMessage = {
          id: Math.random().toString(),
          role: "assistant",
          content: res.text || "Sorry, I couldn't plan that. Please try again.",
          created_at: new Date().toISOString(),
          suggestions: res.suggestions || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      toast({
        title: "AI Assistant Error",
        description: err.message || "Failed to communicate with AI.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Extract JSON structure from AI content if it exists
  const extractInjectedTrip = (content: string) => {
    try {
      const match = content.match(/\{[\s\S]*?\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]);
      // Verify basic schema properties
      if (parsed.toLocation || parsed.trip_title || parsed.duration_days) {
        return parsed;
      }
    } catch (e) {}
    return null;
  };

  const handleInjectSuggestions = (tripData: any) => {
    // Normalise fields to match Zustand store expected state
    const normalizedData = {
      travelStyle: tripData.travel_style || tripData.travelStyle || "solo",
      trip_title: tripData.trip_title || tripData.title || "AI Planned Trip",
      fromLocation: tripData.from_location || tripData.fromLocation || "Bangalore, KA",
      toLocation: tripData.to_location || tripData.toLocation || "",
      fromDate: tripData.from_date || tripData.fromDate || new Date().toISOString(),
      toDate: tripData.to_date || tripData.toDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      tripTypes: tripData.trip_types || tripData.tripTypes || ["adventure"],
      transportModes: tripData.transport_modes || tripData.transportModes || ["mixed"],
      costPerPerson: tripData.cost_per_person || tripData.costPerPerson || "5000",
      accommodationType: tripData.accommodation_type || tripData.accommodationType || "none",
      bookingStatus: tripData.booking_status || tripData.bookingStatus || "",
      accommodationDays: tripData.accommodation_days || tripData.accommodationDays || "",
    };

    setTripDraft(normalizedData);
    toast({
      title: "Suggestions Injected!",
      description: "Data successfully loaded. Redirecting to wizard review...",
      variant: "success",
    });

    setIsOpen(false);
    router.push("/itineraries/new");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Travel Assistant"
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
        >
          <Sparkles className="h-6 w-6 animate-pulse" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[90vw] sm:max-w-md flex flex-col justify-between p-0">
        <SheetHeader className="p-4 border-b border-border flex flex-row items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <SheetTitle className="text-base font-extrabold text-left">AI Travel Assistant</SheetTitle>
            <p className="text-[10px] text-muted-foreground text-left">Llama 3.3 Versatile RAG Companion</p>
          </div>
        </SheetHeader>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 animate-bounce">
                <Bot className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold">Plan with NxtVibes AI</h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Describe your dream vacation, or ask for recommendations like:
                <br />
                <span className="italic font-semibold">&quot;Plan a 3-day adventure trip to Coorg for 4 friends under 15k.&quot;</span>
              </p>
              
              <div className="w-full space-y-2 pt-4">
                <button
                  onClick={(e) => handleSend(e, "Plan a 3-day beach trip to Goa")}
                  className="w-full text-left p-3 rounded-2xl border border-border bg-card hover:border-primary/50 text-xs font-semibold flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <span>🏖️ Plan a 3-day beach trip to Goa</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                <button
                  onClick={(e) => handleSend(e, "Suggest trekking itinerary for Leh Ladakh")}
                  className="w-full text-left p-3 rounded-2xl border border-border bg-card hover:border-primary/50 text-xs font-semibold flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <span>🏔️ Suggest Ladakh trekking itinerary</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const injectedTrip = !isUser ? extractInjectedTrip(msg.content) : null;
              
              return (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end ml-auto" : "self-start items-start mr-auto"}`}>
                  <div className={`rounded-2xl p-3.5 text-xs shadow-sm ${
                    isUser ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card text-foreground rounded-tl-none border border-border leading-relaxed"
                  }`}>
                    {msg.content}
                    
                    {/* Render Inject Button if structured JSON detected */}
                    {injectedTrip && (
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground font-bold mb-2">⭐ AI Structured Plan Detected!</p>
                        <button
                          onClick={() => handleInjectSuggestions(injectedTrip)}
                          className="flex items-center gap-1.5 w-full justify-center bg-primary text-primary-foreground py-2 px-3 rounded-xl font-bold hover:opacity-90 shadow-md text-[10px] cursor-pointer"
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          Inject Suggestions to Planner
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-start gap-2 animate-pulse pl-1">
              <div className="h-5 w-5 rounded-full bg-primary/25 animate-bounce" />
              <p className="text-xs text-muted-foreground">AI is typing...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-card flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a travel prompt..."
            className="flex-1 rounded-2xl border border-border bg-input py-2.5 px-4 text-xs outline-none focus:border-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            aria-label="Send message"
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

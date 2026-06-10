"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Map, Calendar, MapPin, Plus, Search, Users, ShieldAlert, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useItineraryStore } from "@/store/itineraryStore";
import { useToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setTripDraft, setPlaces } = useItineraryStore();
  const [activeTab, setActiveTab] = useState<"saved" | "shared">("saved");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch current user
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      return user;
    },
  });

  // Fetch itineraries from Supabase
  const { data: itineraries = [], isLoading: loadingTrips, refetch } = useQuery({
    queryKey: ["itineraries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleSelectTrip = (trip: any) => {
    // Pack draft data matching store interface
    setTripDraft({
      ...trip,
      fromLocation: trip.from_location,
      toLocation: trip.to_location,
      fromDate: trip.from_date,
      toDate: trip.to_date,
      duration: trip.duration_days,
    });

    // Unpack places
    if (trip.places_to_visit) {
      try {
        const parsed = typeof trip.places_to_visit === "string"
          ? JSON.parse(trip.places_to_visit)
          : trip.places_to_visit;

        if (Array.isArray(parsed)) {
          setPlaces(parsed);
        } else {
          setPlaces([]);
        }
      } catch (e) {
        setPlaces([]);
      }
    } else {
      setPlaces([]);
    }

    router.push(`/itineraries/${trip.id}`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter trips based on ownership and participants
  const filteredTrips = itineraries.filter((trip) => {
    const isOwner = trip.user_id === user?.id;
    let isParticipant = false;

    if (trip.participants) {
      try {
        const participantsList = typeof trip.participants === "string"
          ? JSON.parse(trip.participants)
          : trip.participants;
        if (Array.isArray(participantsList)) {
          isParticipant = participantsList.includes(user?.id);
        }
      } catch (e) {
        isParticipant = false;
      }
    }

    // Tab Filtering
    const matchesTab = activeTab === "saved" ? isOwner : (!isOwner && isParticipant);

    // Search Filtering
    const matchesSearch =
      trip.trip_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.to_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.from_location?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Compute stats
  const totalTrips = itineraries.filter(t => t.user_id === user?.id).length;
  const sharedTrips = itineraries.filter(t => {
    const isOwner = t.user_id === user?.id;
    let list = [];
    try { list = typeof t.participants === "string" ? JSON.parse(t.participants) : (t.participants || []); } catch(e){}
    return !isOwner && Array.isArray(list) && list.includes(user?.id);
  }).length;

  const totalCost = itineraries
    .filter(t => t.user_id === user?.id)
    .reduce((sum, t) => sum + (parseFloat(t.cost_per_person) || 0), 0);

  if (loadingUser || loadingTrips) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold animate-pulse">Retrieving your dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 font-sans relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Trip Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Plan, visualize, and coordinate your travel itineraries in real-time</p>
        </div>
        <button
          onClick={() => router.push("/itineraries/new")}
          className="flex items-center justify-center gap-2 rounded-2xl btn-premium px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-premium cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          Create New Itinerary
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-6 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shadow-sm shadow-primary/5">
            <Map className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Trips</p>
            <h3 className="text-2xl font-black mt-1 bg-gradient-to-r from-primary to-brand-pink bg-clip-text text-transparent">{totalTrips}</h3>
          </div>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-6 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="h-12 w-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary shadow-sm shadow-secondary/5">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Shared Trips</p>
            <h3 className="text-2xl font-black mt-1 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">{sharedTrips}</h3>
          </div>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-6 shadow-premium flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="h-12 w-12 rounded-2xl bg-accent/15 flex items-center justify-center text-accent shadow-sm shadow-accent/5">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Budget</p>
            <h3 className="text-2xl font-black mt-1 bg-gradient-to-r from-accent to-warning bg-clip-text text-transparent">₹{totalCost.toLocaleString("en-IN")}</h3>
          </div>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/60 pb-4 mb-6 gap-4">
        {/* Tab triggers */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-muted/60 backdrop-blur-sm w-fit border border-border/30">
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "saved"
                ? "bg-card text-foreground shadow-sm font-extrabold border border-border/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Saved Itineraries
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "shared"
                ? "bg-card text-foreground shadow-sm font-extrabold border border-border/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Shared with Me
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search itineraries..."
            className="w-full rounded-2xl border border-border/60 bg-input/70 backdrop-blur-sm py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      {/* Trips list */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-3xl p-12 bg-card/50 backdrop-blur-md text-center min-h-[300px]">
          <div className="h-16 w-16 bg-muted/80 rounded-full flex items-center justify-center text-muted-foreground mb-4">
            <Map className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold">No Itineraries Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchQuery
              ? "No trips matched your search query. Try typing something else."
              : activeTab === "saved"
              ? "You haven't planned any trips yet. Click the button above to start your first itinerary!"
              : "No one has shared a collaborative itinerary with you yet."}
          </p>
          {!searchQuery && activeTab === "saved" && (
            <button
              onClick={() => router.push("/itineraries/new")}
              className="mt-6 rounded-2xl btn-premium px-6 py-3 text-sm font-bold text-primary-foreground shadow-premium cursor-pointer"
            >
              Start Planning
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const daysCount = trip.duration_days || 1;
            return (
              <div
                key={trip.id}
                onClick={() => handleSelectTrip(trip)}
                className="group cursor-pointer rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md overflow-hidden premium-card flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Top row */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/10 capitalize">
                      {trip.travel_style || "Solo"}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full border border-border/20">
                      <Calendar className="h-3.5 w-3.5" />
                      {daysCount} {daysCount > 1 ? "Days" : "Day"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1 mb-2">
                    {trip.trip_title || "My Trip"}
                  </h3>

                  {/* Locations */}
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate font-semibold text-foreground/80">{trip.to_location || "Destination"}</span>
                    </div>
                    {trip.from_location && (
                      <div className="flex items-center gap-2 text-xs opacity-75 pl-6">
                        <span>Starting from: {trip.from_location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer bar */}
                <div className="bg-muted/40 px-6 py-4 flex items-center justify-between border-t border-border/40">
                  <div className="text-xs text-muted-foreground font-semibold">
                    {formatDate(trip.from_date)}
                  </div>
                  {trip.cost_per_person > 0 && (
                    <div className="text-sm font-black bg-gradient-to-r from-primary to-brand-pink bg-clip-text text-transparent">
                      ₹{parseFloat(trip.cost_per_person).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

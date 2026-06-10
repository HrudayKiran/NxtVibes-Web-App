"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { 
  Compass, MapPin, Calendar, Car, Train, Bus, Plane, Bike, Shuffle, 
  Bed, Home, Tent, Hotel, XCircle, ArrowLeft, ArrowRight, Save, Info, AlertTriangle 
} from "lucide-react";
import { useItineraryStore } from "@/store/itineraryStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

const TRAVEL_STYLES = [
  { id: "solo", label: "Solo", icon: Compass },
  { id: "couple", label: "Couple", icon: Compass },
  { id: "family", label: "Family", icon: Compass },
  { id: "friends", label: "Friends", icon: Compass },
  { id: "business", label: "Business", icon: Compass },
];

const TRIP_TYPES = [
  { id: "adventure", label: "Adventure", color: "text-amber-500 bg-amber-500/10" },
  { id: "trekking", label: "Trekking", color: "text-emerald-500 bg-emerald-500/10" },
  { id: "bike_ride", label: "Bike Ride", color: "text-red-500 bg-red-500/10" },
  { id: "road_trip", label: "Road Trip", color: "text-purple-500 bg-purple-500/10" },
  { id: "camping", label: "Camping", color: "text-orange-500 bg-orange-500/10" },
  { id: "sightseeing", label: "Sightseeing", color: "text-blue-500 bg-blue-500/10" },
  { id: "beach", label: "Beach", color: "text-cyan-500 bg-cyan-500/10" },
  { id: "pilgrimage", label: "Pilgrimage", color: "text-pink-500 bg-pink-500/10" },
];

const TRANSPORT_MODES = [
  { id: "train", label: "Train", icon: Train },
  { id: "bus", label: "Bus", icon: Bus },
  { id: "car", label: "Car", icon: Car },
  { id: "flight", label: "Flight", icon: Plane },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "mixed", label: "Mixed", icon: Shuffle },
];

const ACCOMMODATIONS = [
  { id: "hotel", label: "Hotel", icon: Hotel },
  { id: "hostel", label: "Hostel", icon: Bed },
  { id: "camping", label: "Camping", icon: Tent },
  { id: "homestay", label: "Homestay", icon: Home },
  { id: "none", label: "Not Needed", icon: XCircle },
];

export default function NewItineraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { tripDraft, setTripDraft, clearDraft } = useItineraryStore();

  const [step, setStep] = useState(1);

  // Form State
  const [travelStyle, setTravelStyle] = useState<string>("");
  const [tripTitle, setTripTitle] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedTransports, setSelectedTransports] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [accommodationDays, setAccommodationDays] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if there is an active draft injected by AI or redirected
  useEffect(() => {
    if (tripDraft) {
      if (tripDraft.travelStyle) setTravelStyle(tripDraft.travelStyle);
      if (tripDraft.trip_title) setTripTitle(tripDraft.trip_title);
      if (tripDraft.fromLocation) setFromLocation(tripDraft.fromLocation);
      if (tripDraft.toLocation) setToLocation(tripDraft.toLocation);
      if (tripDraft.fromDate) setFromDate(new Date(tripDraft.fromDate));
      if (tripDraft.toDate) setToDate(new Date(tripDraft.toDate));
      if (tripDraft.tripTypes) setSelectedActivities(tripDraft.tripTypes);
      if (tripDraft.transportModes) setSelectedTransports(tripDraft.transportModes);
      if (tripDraft.costPerPerson) setBudget(String(tripDraft.costPerPerson));
      if (tripDraft.accommodationType) setAccommodation(tripDraft.accommodationType);
      if (tripDraft.bookingStatus) setBookingStatus(tripDraft.bookingStatus);
      if (tripDraft.accommodationDays) setAccommodationDays(String(tripDraft.accommodationDays));
    }
  }, [tripDraft]);

  const getDuration = () => {
    if (!fromDate || !toDate) return 0;
    const diff = differenceInDays(toDate, fromDate) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleNext = () => {
    if (step === 1 && !travelStyle) {
      toast({ title: "Input Required", description: "Please select a travel style.", variant: "destructive" });
      return;
    }
    if (step === 2 && (!tripTitle.trim() || !fromLocation.trim() || !toLocation.trim() || !fromDate || !toDate)) {
      toast({ title: "Input Required", description: "Please complete all fields in this step.", variant: "destructive" });
      return;
    }
    if (step === 3 && (selectedActivities.length === 0 || selectedTransports.length === 0 || !budget.trim())) {
      toast({ title: "Input Required", description: "Select at least one activity, transport mode, and specify a budget.", variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const handleSave = async () => {
    if (!accommodation) {
      toast({ title: "Input Required", description: "Please choose accommodation preference.", variant: "destructive" });
      return;
    }
    if (accommodation !== "none" && (!bookingStatus || !accommodationDays)) {
      toast({ title: "Input Required", description: "Provide booking status and number of days.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      const duration = getDuration();

      // Create initial itinerary days array
      const timelineDays = Array.from({ length: duration }, (_, i) => ({
        day: i + 1,
        places: []
      }));

      const payload = {
        user_id: user.id,
        trip_title: tripTitle.trim(),
        from_location: fromLocation.trim(),
        to_location: toLocation.trim(),
        from_date: fromDate?.toISOString(),
        to_date: toDate?.toISOString(),
        duration_days: duration,
        travel_style: travelStyle,
        trip_types: selectedActivities,
        transport_modes: selectedTransports,
        cost_per_person: parseFloat(budget) || 0,
        accommodation_type: accommodation,
        booking_status: accommodation !== "none" ? bookingStatus : null,
        accommodation_days: accommodation !== "none" ? parseInt(accommodationDays) || 0 : null,
        itinerary: timelineDays,
        places_to_visit: [],
        checklist: [],
        notes: [],
        participants: [user.id]
      };

      const { data, error } = await supabase
        .from("itineraries")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Trip Planned!",
        description: "Itinerary outline saved successfully.",
        variant: "success",
      });

      // Clear draft and navigate
      clearDraft();
      router.push(`/itineraries/${data.id}`);
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save trip.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-background p-6 md:p-10 font-sans flex flex-col max-w-2xl mx-auto w-full justify-center min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Trip Planner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Step {step} of 4:{" "}
          {step === 1 && "Travel Style"}
          {step === 2 && "Dates & Destination"}
          {step === 3 && "Activities & Transit"}
          {step === 4 && "Accommodation Options"}
        </p>
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-muted rounded-full mt-4 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Stepper Content */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-premium min-h-[380px] flex flex-col justify-between">
        <div>
          {/* STEP 1: Travel Style */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center">What is your travel style?</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {TRAVEL_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setTravelStyle(style.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border text-sm font-semibold transition-all cursor-pointer ${
                      travelStyle === style.id
                        ? "bg-primary border-primary text-primary-foreground font-bold shadow-glow"
                        : "bg-input border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <Compass className="h-6 w-6" />
                    <span>{style.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Location & Dates */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center mb-4">Where & When are you traveling?</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Trip Title</label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  placeholder="e.g. Coorg Weekend Getaway"
                  className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">Starting From</label>
                  <input
                    type="text"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    placeholder="e.g. Bangalore, KA"
                    className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">Destination</label>
                  <input
                    type="text"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    placeholder="e.g. Coorg, KA"
                    className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none flex items-center gap-2 cursor-pointer text-left">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{fromDate ? format(fromDate, "PPP") : "Select Date"}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarUI
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground ml-1">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none flex items-center gap-2 cursor-pointer text-left">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{toDate ? format(toDate, "PPP") : "Select Date"}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarUI
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        disabled={(date) => !!fromDate && date < fromDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {fromDate && toDate && (
                <div className="text-xs font-bold bg-primary/10 text-primary py-2 px-4 rounded-xl w-fit mx-auto mt-2">
                  Duration: {getDuration()} Days
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Activities & Transit */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider ml-1">Select Activities</h4>
                <div className="flex flex-wrap gap-2">
                  {TRIP_TYPES.map((activity) => {
                    const isSelected = selectedActivities.includes(activity.id);
                    return (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() => {
                          setSelectedActivities((prev) =>
                            prev.includes(activity.id)
                              ? prev.filter((a) => a !== activity.id)
                              : [...prev, activity.id]
                          );
                        }}
                        className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-black shadow-glow"
                            : "bg-input text-muted-foreground border border-border hover:bg-muted"
                        }`}
                      >
                        {activity.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider ml-1">Transit Modes</h4>
                <div className="grid grid-cols-3 gap-3">
                  {TRANSPORT_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = selectedTransports.includes(mode.id);
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setSelectedTransports((prev) =>
                            prev.includes(mode.id)
                              ? prev.filter((t) => t !== mode.id)
                              : [...prev, mode.id]
                          );
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-foreground border-foreground text-background font-bold shadow-md"
                            : "bg-input border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Estimated Cost Per Person (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Accommodation */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-xl font-bold text-center mb-4">Accommodation Options</h3>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ACCOMMODATIONS.map((acc) => {
                  const Icon = acc.icon;
                  const isSelected = accommodation === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccommodation(acc.id)}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground font-bold shadow-glow"
                          : "bg-input border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{acc.label}</span>
                    </button>
                  );
                })}
              </div>

              {accommodation && accommodation !== "none" && (
                <div className="space-y-4 pt-3 border-t border-border mt-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">Booking Status</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingStatus("booked")}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          bookingStatus === "booked"
                            ? "bg-foreground border-foreground text-background font-bold shadow-md"
                            : "bg-input border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        Already Booked
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStatus("to_book")}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          bookingStatus === "to_book"
                            ? "bg-foreground border-foreground text-background font-bold shadow-md"
                            : "bg-input border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        Yet to Book
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">Accommodation Days</label>
                    <input
                      type="number"
                      value={accommodationDays}
                      onChange={(e) => setAccommodationDays(e.target.value)}
                      placeholder="e.g. 3"
                      className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center gap-4 mt-8 pt-4 border-t border-border">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 py-3 px-6 rounded-2xl border border-border hover:bg-muted text-sm font-semibold transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 py-3 px-6 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-glow hover:opacity-95 transition-opacity cursor-pointer ml-auto"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSave}
              className="flex items-center gap-1.5 py-3 px-6 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-glow hover:opacity-95 transition-opacity cursor-pointer ml-auto disabled:opacity-50"
            >
              <Save className="h-4.5 w-4.5" />
              {submitting ? "Saving..." : "Save Itinerary"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

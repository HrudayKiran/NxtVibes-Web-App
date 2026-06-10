"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, MapPin, Plus, Users, CheckSquare, Square, 
  Map as MapIcon, ClipboardList, StickyNote, Clock, 
  Trash2, Edit3, GripVertical, Check, MessageSquare, ChevronRight, UserPlus
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { workersApi } from "@/lib/workersApi";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

// Types
import { StructuredPlace, ChecklistItem, CustomNote } from "@/store/itineraryStore";

declare global {
  interface Window {
    google: any;
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "";
  }
};

export default function ItineraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tripId = params.id as string;

  const [activeTab, setActiveTab] = useState("timeline");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Itinerary state
  const [trip, setTrip] = useState<any>(null);
  const [places, setPlaces] = useState<StructuredPlace[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState<CustomNote[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);

  // Dialog states
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceTime, setNewPlaceTime] = useState("");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceDay, setNewPlaceDay] = useState(1);
  const [editingPlace, setEditingPlace] = useState<StructuredPlace | null>(null);

  const [addCollabOpen, setAddCollabOpen] = useState(false);
  const [collabSearch, setCollabSearch] = useState("");
  const [collabResults, setCollabResults] = useState<any[]>([]);
  const [searchingCollab, setSearchingCollab] = useState(false);

  const [noteOpen, setNoteOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<CustomNote | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [checklistOpen, setChecklistOpen] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] = useState("General");
  const [customCategoryName, setCustomCategoryName] = useState("");

  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // Initial Fetch of Itinerary Details
  const fetchItineraryDetails = useCallback(async () => {
    if (!tripId) return;
    try {
      // 1. Fetch itinerary
      const { data: tripData, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error) throw error;
      setTrip(tripData);

      // 2. Unpack places
      let unpackedPlaces: StructuredPlace[] = [];
      if (tripData.places_to_visit) {
        unpackedPlaces = typeof tripData.places_to_visit === "string"
          ? JSON.parse(tripData.places_to_visit)
          : tripData.places_to_visit;
      }
      setPlaces(Array.isArray(unpackedPlaces) ? unpackedPlaces : []);

      // 3. Unpack checklist
      let unpackedChecklist: ChecklistItem[] = [];
      if (tripData.checklist) {
        unpackedChecklist = typeof tripData.checklist === "string"
          ? JSON.parse(tripData.checklist)
          : tripData.checklist;
      }
      setChecklist(Array.isArray(unpackedChecklist) ? unpackedChecklist : []);

      // 4. Unpack notes
      let unpackedNotes: CustomNote[] = [];
      if (tripData.notes) {
        unpackedNotes = typeof tripData.notes === "string"
          ? JSON.parse(tripData.notes)
          : tripData.notes;
      }
      setNotes(Array.isArray(unpackedNotes) ? unpackedNotes : []);

      // 5. Fetch collaborators profiles
      let participantIds: string[] = [];
      if (tripData.participants) {
        participantIds = typeof tripData.participants === "string"
          ? JSON.parse(tripData.participants)
          : tripData.participants;
      }

      if (participantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, username, photo_url")
          .in("id", participantIds);
        setCollaborators(profiles || []);
      }
    } catch (err: any) {
      toast({
        title: "Load Failed",
        description: err.message || "Failed to load itinerary details.",
        variant: "destructive",
      });
    }
  }, [tripId, toast]);

  useEffect(() => {
    fetchItineraryDetails();
  }, [fetchItineraryDetails]);

  // Real-time Database Subscription Setup
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`itinerary-detail-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "itineraries",
          filter: `id=eq.${tripId}`,
        },
        (payload: any) => {
          const updatedTrip = payload.new;
          setTrip(updatedTrip);

          // Update places
          if (updatedTrip.places_to_visit) {
            try {
              const parsed = typeof updatedTrip.places_to_visit === "string"
                ? JSON.parse(updatedTrip.places_to_visit)
                : updatedTrip.places_to_visit;
              setPlaces(Array.isArray(parsed) ? parsed : []);
            } catch (e) {}
          }

          // Update checklist
          if (updatedTrip.checklist) {
            try {
              const parsed = typeof updatedTrip.checklist === "string"
                ? JSON.parse(updatedTrip.checklist)
                : updatedTrip.checklist;
              setChecklist(Array.isArray(parsed) ? parsed : []);
            } catch (e) {}
          }

          // Update notes
          if (updatedTrip.notes) {
            try {
              const parsed = typeof updatedTrip.notes === "string"
                ? JSON.parse(updatedTrip.notes)
                : updatedTrip.notes;
              setNotes(Array.isArray(parsed) ? parsed : []);
            } catch (e) {}
          }

          // Fetch collaborators profiles if participants list changed
          if (updatedTrip.participants) {
            try {
              const ids = typeof updatedTrip.participants === "string"
                ? JSON.parse(updatedTrip.participants)
                : updatedTrip.participants;
              supabase
                .from("profiles")
                .select("id, name, username, photo_url")
                .in("id", ids)
                .then(({ data: profiles }) => {
                  if (profiles) setCollaborators(profiles);
                });
            } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  // Save changes to Supabase
  const saveTripChanges = async (updates: Partial<typeof trip>) => {
    try {
      const { error } = await supabase
        .from("itineraries")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tripId);

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: "Collaboration Sync Failed",
        description: err.message || "Failed to sync updates.",
        variant: "destructive",
      });
    }
  };

  // Timeline Operations
  const handleAddPlace = () => {
    if (!newPlaceName.trim()) return;

    const newPlace: StructuredPlace = {
      id: Math.random().toString(36).substring(2, 9),
      name: newPlaceName.trim(),
      day: newPlaceDay,
      order: places.filter((p) => p.day === newPlaceDay).length,
      time: newPlaceTime || undefined,
      address: newPlaceAddress || undefined,
    };

    const updatedPlaces = [...places, newPlace];
    setPlaces(updatedPlaces);
    saveTripChanges({ places_to_visit: updatedPlaces });

    setNewPlaceName("");
    setNewPlaceTime("");
    setNewPlaceAddress("");
    setAddPlaceOpen(false);
  };

  const handleEditPlace = (place: StructuredPlace) => {
    setEditingPlace(place);
    setNewPlaceName(place.name);
    setNewPlaceTime(place.time || "");
    setNewPlaceAddress(place.address || "");
    setNewPlaceDay(place.day);
    setAddPlaceOpen(true);
  };

  const handleUpdatePlace = () => {
    if (!editingPlace || !newPlaceName.trim()) return;

    const updatedPlaces = places.map((p) => {
      if (p.id === editingPlace.id) {
        return {
          ...p,
          name: newPlaceName.trim(),
          day: newPlaceDay,
          time: newPlaceTime || undefined,
          address: newPlaceAddress || undefined,
        };
      }
      return p;
    });

    setPlaces(updatedPlaces);
    saveTripChanges({ places_to_visit: updatedPlaces });

    setEditingPlace(null);
    setNewPlaceName("");
    setNewPlaceTime("");
    setNewPlaceAddress("");
    setAddPlaceOpen(false);
  };

  const handleDeletePlace = (id: string) => {
    const updatedPlaces = places.filter((p) => p.id !== id);
    setPlaces(updatedPlaces);
    saveTripChanges({ places_to_visit: updatedPlaces });
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, placeId: string) => {
    e.dataTransfer.setData("text/plain", placeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    const placeId = e.dataTransfer.getData("text/plain");
    if (!placeId) return;

    const updatedPlaces = places.map((p) => {
      if (p.id === placeId) {
        return { ...p, day: targetDay };
      }
      return p;
    });

    setPlaces(updatedPlaces);
    saveTripChanges({ places_to_visit: updatedPlaces });
  };

  // Checklist Operations
  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newChecklistText.trim(),
      checked: false,
      category: newChecklistCategory,
    };

    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    saveTripChanges({ checklist: updatedChecklist });

    setNewChecklistText("");
    setChecklistOpen(false);
  };

  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    saveTripChanges({ checklist: updated });
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklist.filter((item) => item.id !== id);
    setChecklist(updated);
    saveTripChanges({ checklist: updated });
  };

  // Notes Operations
  const handleAddNote = () => {
    if (!noteTitle.trim()) return;

    const newNote: CustomNote = {
      id: Math.random().toString(36).substring(2, 9),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      order: notes.length,
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    saveTripChanges({ notes: updatedNotes });

    setNoteTitle("");
    setNoteContent("");
    setNoteOpen(false);
  };

  const handleUpdateNote = () => {
    if (!activeNote || !noteTitle.trim()) return;

    const updatedNotes = notes.map((n) => {
      if (n.id === activeNote.id) {
        return {
          ...n,
          title: noteTitle.trim(),
          content: noteContent.trim(),
        };
      }
      return n;
    });

    setNotes(updatedNotes);
    saveTripChanges({ notes: updatedNotes });

    setActiveNote(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveTripChanges({ notes: updated });
  };

  // Collaborators Operations
  useEffect(() => {
    if (!collabSearch.trim()) {
      setCollabResults([]);
      return;
    }

    const searchUsers = async () => {
      setSearchingCollab(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, username, photo_url")
          .or(`name.ilike.%${collabSearch}%,username.ilike.%${collabSearch}%`)
          .limit(5);

        if (error) throw error;
        setCollabResults(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingCollab(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [collabSearch]);

  const handleAddCollaborator = async (collabId: string) => {
    const currentParticipants = trip?.participants || [];
    let list = Array.isArray(currentParticipants)
      ? currentParticipants
      : JSON.parse(currentParticipants || "[]");

    if (list.includes(collabId)) {
      toast({ title: "Already Added", description: "This traveler is already a collaborator." });
      return;
    }

    const updatedParticipants = [...list, collabId];
    await saveTripChanges({ participants: updatedParticipants });

    // Link collaborator to Group Chat
    try {
      await workersApi("/group_chats/create", {
        method: "POST",
        body: {
          itineraryId: tripId,
          name: trip.trip_title,
          participants: updatedParticipants,
        },
      });
    } catch (err) {
      console.error("Failed to update group chat participants:", err);
    }

    toast({ title: "Collaborator Added", description: "Linked traveler successfully.", variant: "success" });
    setAddCollabOpen(false);
    setCollabSearch("");
    fetchItineraryDetails();
  };

  // Map Integration Loader
  useEffect(() => {
    if (activeTab !== "map" || !mapRef.current || !trip) return;

    const initMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps || !window.google.maps.Map) return;

      const defaultCenter = { lat: 12.9716, lng: 77.5946 }; // Bangalore
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#242f3e" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#242f3e" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#746855" }],
          },
        ],
      });

      googleMapRef.current = map;
      geocodeLocations();
    };

    const geocodeLocations = () => {
      if (!window.google || !window.google.maps || !window.google.maps.Geocoder) return;
      const geocoder = new window.google.maps.Geocoder();
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const destination = trip.to_location;
      if (!destination) return;

      geocoder.geocode({ address: destination }, (results: any, status: any) => {
        if (status === "OK" && googleMapRef.current) {
          const loc = results[0].geometry.location;
          googleMapRef.current.setCenter(loc);
          googleMapRef.current.setZoom(13);

          const marker = new window.google.maps.Marker({
            position: loc,
            map: googleMapRef.current,
            title: destination,
            icon: {
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#9d74f7",
              fillOpacity: 0.9,
              strokeWeight: 2,
              strokeColor: "#ffffff",
            },
          });
          markersRef.current.push(marker);
        }
      });
    };

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        initMap();
        return;
      }

      (window as any).initGoogleMapsCallback = () => {
        initMap();
      };

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) return;

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    loadGoogleMaps();
  }, [activeTab, trip]);

  // Checklist Categories helper
  const checklistCategories = ["General", "Documents", "Medication", "Clothing", "Gear", ...new Set(checklist.map(i => i.category).filter(c => !["General", "Documents", "Medication", "Clothing", "Gear"].includes(c)))];

  if (!trip) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold animate-pulse">Synchronizing changes...</p>
        </div>
      </div>
    );
  }

  const duration = trip.duration_days || 1;

  return (
    <div className="flex-1 font-sans p-6 md:p-10 max-w-5xl mx-auto w-full relative z-10">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-border/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{trip.trip_title}</h1>
            <span className="text-xs font-bold bg-primary/15 text-primary border border-primary/10 py-1.5 px-3.5 rounded-full capitalize">
              {trip.travel_style}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3 font-semibold">
            <span className="flex items-center gap-2 bg-muted/40 border border-border/20 px-3.5 py-1.5 rounded-full">
              <MapPin className="h-4 w-4 text-primary" />
              {trip.from_location} &rarr; {trip.to_location}
            </span>
            <span className="flex items-center gap-2 bg-muted/40 border border-border/20 px-3.5 py-1.5 rounded-full">
              <Calendar className="h-4 w-4 text-secondary" />
              {formatDate(trip.from_date)} - {formatDate(trip.to_date)} ({duration} Days)
            </span>
          </div>
        </div>

        {/* Collaborators row */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5 overflow-hidden">
            {collaborators.map((c) => (
              <div
                key={c.id}
                title={c.name}
                className="h-9.5 w-9.5 overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer"
              >
                {c.photo_url ? (
                  <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary font-bold text-xs">
                    {c.name[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setAddCollabOpen(true)}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-border/40 bg-card/65 backdrop-blur-md text-muted-foreground hover:text-foreground transition-all hover:scale-105 cursor-pointer shadow-premium"
          >
            <UserPlus className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => router.push("/messages")}
            className="flex items-center gap-2 rounded-2xl btn-premium px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-premium cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            Discuss
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <Tabs defaultValue="timeline" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:max-w-md rounded-2xl bg-muted/60 backdrop-blur-sm p-1 border border-border/20 shadow-sm">
          <TabsTrigger value="timeline" className="rounded-xl font-bold py-2 transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm cursor-pointer"><Clock className="h-4 w-4 mr-2 text-primary" />Timeline</TabsTrigger>
          <TabsTrigger value="checklist" className="rounded-xl font-bold py-2 transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm cursor-pointer"><ClipboardList className="h-4 w-4 mr-2 text-secondary" />Checklist</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-xl font-bold py-2 transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm cursor-pointer"><StickyNote className="h-4 w-4 mr-2 text-accent" />Notes</TabsTrigger>
          <TabsTrigger value="map" className="rounded-xl font-bold py-2 transition-all data-[state=active]:bg-card data-[state=active]:shadow-sm cursor-pointer"><MapIcon className="h-4 w-4 mr-2 text-success" />Map</TabsTrigger>
        </TabsList>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Daily Timeline</h3>
            <button
              onClick={() => {
                setEditingPlace(null);
                setAddPlaceOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold btn-premium py-2 px-4 rounded-xl shadow-premium cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Destination
            </button>
          </div>

          <div className="space-y-6">
            {Array.from({ length: duration }).map((_, i) => {
              const dayNum = i + 1;
              const dayPlaces = places
                .filter((p) => p.day === dayNum)
                .sort((a, b) => a.order - b.order);

              return (
                <div
                  key={dayNum}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dayNum)}
                  className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-6 shadow-premium transition-all hover:bg-card/85 min-h-[120px] relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-brand-pink" />
                  <h4 className="text-base font-bold text-primary mb-4 pl-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary font-black border border-primary/20">{dayNum}</span>
                    Day {dayNum}
                  </h4>
                  
                  {dayPlaces.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic border border-dashed border-border p-4 rounded-2xl text-center">
                      No destinations added yet. Drag destinations here or click Add.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dayPlaces.map((place) => (
                        <div
                          key={place.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, place.id)}
                          className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background/80 border border-border/60 group hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm">{place.name}</h5>
                                {place.time && (
                                  <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {place.time}
                                  </span>
                                )}
                              </div>
                              {place.address && (
                                <p className="text-xs text-muted-foreground mt-0.5">{place.address}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditPlace(place)}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlace(place.id)}
                              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* CHECKLIST TAB */}
        <TabsContent value="checklist" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Trip Checklist</h3>
            <button
              onClick={() => setChecklistOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold btn-premium py-2 px-4 rounded-xl shadow-premium cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checklistCategories.map((cat) => {
              const catItems = checklist.filter((item) => item.category === cat);
              if (catItems.length === 0 && !["General", "Documents"].includes(cat)) return null;

              return (
                <div key={cat} className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-6 shadow-premium hover:shadow-lg transition-all duration-300">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                    {cat}
                  </h4>

                  {catItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No items in this category.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {catItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group">
                          <button
                            onClick={() => handleToggleChecklist(item.id)}
                            className="flex items-center gap-3 text-sm text-left hover:text-primary transition-colors cursor-pointer"
                          >
                            {item.checked ? (
                              <CheckSquare className="h-5 w-5 text-primary shrink-0" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <span className={item.checked ? "line-through text-muted-foreground" : "font-medium"}>
                              {item.text}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Collaborative Notes</h3>
            <button
              onClick={() => {
                setActiveNote(null);
                setNoteTitle("");
                setNoteContent("");
                setNoteOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold btn-premium py-2 px-4 rounded-xl shadow-premium cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-3xl p-12 bg-card/50 backdrop-blur-md text-center min-h-[200px]">
              <StickyNote className="h-8 w-8 text-muted-foreground mb-3 animate-pulse" />
              <p className="text-sm font-bold">No Notes Yet</p>
              <p className="text-xs text-muted-foreground mt-1">Leave suggestions, contact numbers, or travel resources here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNote(note);
                    setNoteTitle(note.title);
                    setNoteContent(note.content);
                    setNoteOpen(true);
                  }}
                  className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-6 shadow-premium premium-card cursor-pointer flex flex-col justify-between group min-h-[180px] hover:-rotate-1"
                >
                  <div>
                    <h4 className="font-bold text-base line-clamp-1 mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{note.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line leading-relaxed">{note.content}</p>
                  </div>
                  <div className="flex justify-end pt-4 mt-4 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MAP TAB */}
        <TabsContent value="map" className="space-y-6">
          <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md overflow-hidden shadow-premium h-[500px]" ref={mapRef} />
        </TabsContent>
      </Tabs>

      {/* DIALOG: Add/Edit Place */}
      <Dialog open={addPlaceOpen} onOpenChange={setAddPlaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlace ? "Modify Destination" : "Add Destination"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Destination Name</label>
              <input
                type="text"
                value={newPlaceName}
                onChange={(e) => setNewPlaceName(e.target.value)}
                placeholder="e.g. Abbey Falls"
                className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Visit Day</label>
                <select
                  value={newPlaceDay}
                  onChange={(e) => setNewPlaceDay(parseInt(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
                >
                  {Array.from({ length: duration }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Time (Optional)</label>
                <input
                  type="text"
                  value={newPlaceTime}
                  onChange={(e) => setNewPlaceTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Address / Description (Optional)</label>
              <input
                type="text"
                value={newPlaceAddress}
                onChange={(e) => setNewPlaceAddress(e.target.value)}
                placeholder="e.g. Madikeri Road, Coorg"
                className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="py-2.5 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted">Cancel</button>
            </DialogClose>
            <button
              onClick={editingPlace ? handleUpdatePlace : handleAddPlace}
              className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-glow"
            >
              {editingPlace ? "Save Updates" : "Add Location"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Add Collaborator */}
      <Dialog open={addCollabOpen} onOpenChange={setAddCollabOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Collaborative Traveler</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Search Username / Name</label>
              <input
                type="text"
                value={collabSearch}
                onChange={(e) => setCollabSearch(e.target.value)}
                placeholder="Type name..."
                className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2 mt-2">
              {searchingCollab && <p className="text-xs text-muted-foreground animate-pulse pl-1">Searching profiles...</p>}
              {!searchingCollab && collabSearch && collabResults.length === 0 && (
                <p className="text-xs text-muted-foreground italic pl-1">No travelers found.</p>
              )}
              {collabResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleAddCollaborator(result.id)}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border hover:border-primary/50 bg-card cursor-pointer hover:bg-muted/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-border bg-muted">
                      {result.photo_url ? (
                        <img src={result.photo_url} alt={result.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary font-semibold text-xs">
                          {result.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{result.name}</p>
                      <p className="text-xs text-muted-foreground">@{result.username}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Notes Editor */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeNote ? "Modify Note" : "Create Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Note Title</label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Packing Checklist"
                className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Content</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add descriptions, reference links, etc."
                rows={5}
                className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between w-full">
            {activeNote && (
              <button
                onClick={() => {
                  handleDeleteNote(activeNote.id);
                  setNoteOpen(false);
                }}
                className="py-2.5 px-4 rounded-xl border border-destructive/20 hover:bg-destructive/5 text-destructive text-sm font-semibold mr-auto"
              >
                Delete Note
              </button>
            )}
            <div className="flex gap-2 justify-end ml-auto">
              <DialogClose asChild>
                <button className="py-2.5 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted">Cancel</button>
              </DialogClose>
              <button
                onClick={activeNote ? handleUpdateNote : handleAddNote}
                className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-glow"
              >
                Save
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Checklist Task Creator */}
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Checklist Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Task Description</label>
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="e.g. Book hotels"
                className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Category</label>
              <div className="flex gap-2">
                <select
                  value={newChecklistCategory}
                  onChange={(e) => setNewChecklistCategory(e.target.value)}
                  className="flex-1 rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
                >
                  {checklistCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="NEW_CATEGORY">+ Create New Category</option>
                </select>
              </div>
            </div>

            {newChecklistCategory === "NEW_CATEGORY" && (
              <div className="space-y-1.5 animate-in fade-in-0 duration-200">
                <label className="text-xs font-semibold text-muted-foreground">New Category Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g. Hiking Items"
                    className="flex-1 rounded-2xl border border-border bg-input py-2 px-4 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customCategoryName.trim()) return;
                      setNewChecklistCategory(customCategoryName.trim());
                      setCustomCategoryName("");
                    }}
                    className="py-2 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-glow"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="py-2.5 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted">Cancel</button>
            </DialogClose>
            <button
              onClick={handleAddChecklist}
              className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-glow"
            >
              Add Task
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

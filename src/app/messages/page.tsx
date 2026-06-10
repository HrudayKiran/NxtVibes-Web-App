"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  Search, Send, Image as ImageIcon, Mic, Square as SquareIcon, Play, Pause,
  Users, User, ChevronLeft, ChevronRight, Plus, Smile, MessageSquare, AlertCircle, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { workersApi } from "@/lib/workersApi";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

// Types matching Supabase tables
type Profile = {
  id: string;
  name: string;
  username: string;
  photo_url: string | null;
};

type Chat = {
  id: string;
  type: "direct" | "group";
  name: string;
  photo_url: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  participants: string[];
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  type: "text" | "image" | "location" | "voice";
  text?: string;
  media_url?: string;
  voice_duration?: number;
  created_at: string;
};

const PRESET_LOCATIONS = [
  { name: "Namdroling Monastery (Golden Temple)", coords: "12.4539,75.9682" },
  { name: "Abbey Falls, Madikeri", coords: "12.4536,75.7196" },
  { name: "Raja's Seat, Coorg", coords: "12.4149,75.7369" },
  { name: "Mandalpatti Peak, Coorg", coords: "12.5186,75.7611" },
  { name: "Dubare Elephant Camp", coords: "12.3688,75.9029" },
  { name: "Bangalore Palace", coords: "12.9982,77.5922" },
  { name: "Kempegowda International Airport", coords: "13.1986,77.7066" },
];

export default function MessagesPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Location sharing states
  const [shareLocationOpen, setShareLocationOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [customCoords, setCustomCoords] = useState("");

  // Layout & Navigation state
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Chat window state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Dialog state (Create DM/Group)
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  // Media upload states
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback states
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // References for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Fetch current user details
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setCurrentUser(profile);
      }
    };
    fetchUser();
  }, []);

  // Fetch Chats (DMs & Group Chats)
  const fetchChats = useCallback(async () => {
    if (!currentUser) return;
    setLoadingChats(true);
    try {
      // 1. Fetch direct chats
      const { data: directData } = await supabase
        .from("direct_chats")
        .select("*")
        .contains("participants", [currentUser.id]);

      // 2. Fetch group chats
      const { data: groupData } = await supabase
        .from("group_chats")
        .select("*")
        .contains("participants", [currentUser.id]);

      // 3. Resolve participant profiles for direct chats
      const allDirectChats: Chat[] = [];
      if (directData && directData.length > 0) {
        for (const chat of directData) {
          const otherUserId = chat.participants.find((p: string) => p !== currentUser.id);
          if (otherUserId) {
            const { data: otherProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", otherUserId)
              .maybeSingle();

            allDirectChats.push({
              id: chat.id,
              type: "direct",
              name: otherProfile?.name || "Traveler",
              photo_url: otherProfile?.photo_url || null,
              last_message: chat.last_message?.text || "",
              last_message_at: chat.last_message_at || chat.updated_at,
              participants: chat.participants,
            });
          }
        }
      }

      // 4. Map group chats
      const allGroupChats: Chat[] = (groupData || []).map((chat) => ({
        id: chat.id,
        type: "group",
        name: chat.group_name || "Trip Group",
        photo_url: chat.group_icon || chat.itinerary_image || null,
        last_message: chat.last_message?.text || "",
        last_message_at: chat.updated_at,
        participants: chat.participants,
      }));

      // Merge and Sort
      const mergedChats = [...allDirectChats, ...allGroupChats].sort((a, b) => {
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      });

      setChats(mergedChats);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoadingChats(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat || !currentUser) return;
    setLoadingMessages(true);
    setMessages([]);

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", activeChat.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
        scrollToBottom();
      }
    };

    fetchMessages();

    // Subscribe to messages in this chat
    const channel = supabase
      .channel(`chat-messages-${activeChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${activeChat.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, currentUser]);

  // Real-time Typing Indicator Broadcaster & Subscriptions
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    const channel = supabase.channel(`typing-${activeChat.id}`);

    // Listen to typing event
    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, userName, typing } = payload.payload;
        if (userId !== currentUser.id) {
          setTypingUsers((prev) => {
            if (typing && !prev.includes(userName)) {
              return [...prev, userName];
            } else if (!typing) {
              return prev.filter((u) => u !== userName);
            }
            return prev;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, currentUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Broadcast typing indicator status
  const handleTyping = () => {
    if (!activeChat || !currentUser) return;

    if (!isTyping) {
      setIsTyping(true);
      const channel = supabase.channel(`typing-${activeChat.id}`);
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUser.id, userName: currentUser.name, typing: true },
      });
    }

    // Debounce typing status removal
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      const channel = supabase.channel(`typing-${activeChat.id}`);
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUser.id, userName: currentUser.name, typing: false },
      });
    }, 2000);
  };

  // Send Message logic
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat || !currentUser) return;

    const payload = {
      chat_id: activeChat.id,
      chat_type: activeChat.type,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      type: "text",
      text: inputText.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setInputText("");

    try {
      // 1. Save directly to Supabase messages
      const { error } = await supabase.from("messages").insert([payload]);
      if (error) throw error;

      // 2. Trigger off-line FCM notifications via workers
      try {
        await workersApi("/chat/send-notification", {
          method: "POST",
          body: {
            chatId: activeChat.id,
            chatType: activeChat.type,
            senderName: currentUser.name,
            messagePreview: payload.text,
          },
        });
      } catch (err) {
        console.error("FCM Notification trigger failed:", err);
      }

      scrollToBottom();
    } catch (err: any) {
      toast({
        title: "Failed to send",
        description: err.message || "Message delivery failed.",
        variant: "destructive",
      });
    }
  };

  // Image Upload logic
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !currentUser) return;

    setUploadingMedia(true);
    try {
      // 1. Get presigned upload URL from Cloudflare Workers
      const { uploadUrl, objectKey } = await workersApi("/media/presigned-url", {
        method: "POST",
        body: {
          fileName: `${Date.now()}-${file.name}`,
          fileType: file.type,
        },
      });

      // 2. Upload directly to Cloudflare R2
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) throw new Error("File upload failed.");

      const mediaUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${objectKey}`;

      // 3. Write message record to Supabase
      const { error } = await supabase.from("messages").insert([
        {
          chat_id: activeChat.id,
          chat_type: activeChat.type,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          type: "image",
          media_url: mediaUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      scrollToBottom();
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not deliver image.",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  // Voice Message Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        uploadVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setVoiceDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast({
        title: "Mic Access Denied",
        description: "Please enable microphone permissions in your browser.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const uploadVoiceMessage = async (blob: Blob) => {
    if (!activeChat || !currentUser) return;
    setUploadingMedia(true);
    try {
      // 1. Get presigned R2 upload URL
      const { uploadUrl, objectKey } = await workersApi("/media/presigned-url", {
        method: "POST",
        body: {
          fileName: `voice-${Date.now()}.webm`,
          fileType: "audio/webm",
        },
      });

      // 2. Upload file directly to R2
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "audio/webm" },
        body: blob,
      });

      if (!res.ok) throw new Error("Failed to upload audio.");

      const mediaUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${objectKey}`;

      // 3. Write message record
      const { error } = await supabase.from("messages").insert([
        {
          chat_id: activeChat.id,
          chat_type: activeChat.type,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          type: "voice",
          media_url: mediaUrl,
          voice_duration: voiceDuration,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      scrollToBottom();
    } catch (err: any) {
      toast({
        title: "Voice Message Failed",
        description: err.message || "Failed to deliver voice note.",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  // Audio Playback Player controller
  const handlePlayAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      activeAudioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      activeAudioRef.current?.pause();
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      activeAudioRef.current = audio;
      setPlayingAudioId(id);
    }
  };

  // User Search Operations (Dialog autocomplete)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const searchUsers = async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, username, photo_url")
          .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .neq("id", currentUser?.id)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  const handleStartDirectChat = async (otherUserId: string) => {
    if (!currentUser) return;
    try {
      const { id } = await workersApi("/direct_chats/create", {
        method: "POST",
        body: { otherUserId },
      });

      // Fetch chats and select
      await fetchChats();
      setNewChatOpen(false);
      setSearchQuery("");

      const existingChat = chats.find(c => c.id === id);
      if (existingChat) {
        setActiveChat(existingChat);
        setMobileView("chat");
      } else {
        // Fallback manually construct chat item
        const { data: otherProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherUserId)
          .single();

        const newChat: Chat = {
          id,
          type: "direct",
          name: otherProfile?.name || "Traveler",
          photo_url: otherProfile?.photo_url || null,
          participants: [currentUser.id, otherUserId],
        };
        setActiveChat(newChat);
        setMobileView("chat");
      }
    } catch (err: any) {
      toast({
        title: "Chat Creation Failed",
        description: err.message || "Failed to establish DM.",
        variant: "destructive",
      });
    }
  };

  const handleShareLocation = async (name: string, coords: string) => {
    if (!activeChat || !currentUser) return;
    try {
      const { error } = await supabase.from("messages").insert([
        {
          chat_id: activeChat.id,
          chat_type: activeChat.type,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          type: "location",
          text: name,
          media_url: coords,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      setShareLocationOpen(false);
      setLocationSearchQuery("");
      setCustomCoords("");
      scrollToBottom();
    } catch (err: any) {
      toast({
        title: "Failed to share location",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex bg-background font-sans h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
      {/* 1. Chats Sidebar List */}
      <aside className={cn(
        "w-full md:w-80 border-r border-border bg-card flex flex-col h-full shrink-0 transition-all duration-300 md:translate-x-0",
        mobileView === "chat" ? "hidden md:flex" : "flex"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <button
            onClick={() => setNewChatOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow hover:opacity-95 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Chats feed list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
          {loadingChats ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground flex flex-col items-center justify-center h-40">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs font-bold">No Active Conversations</p>
              <p className="text-[10px] opacity-80 mt-0.5">Click the plus icon to start a chat</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    setMobileView("chat");
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-muted transition-colors",
                    isActive && "bg-muted"
                  )}
                >
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted shrink-0">
                    {chat.photo_url ? (
                      <img src={chat.photo_url} alt={chat.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary font-bold text-sm">
                        {chat.type === "group" ? <Users className="h-5 w-5" /> : chat.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="text-sm font-bold truncate">{chat.name}</h4>
                      {chat.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(chat.last_message_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.last_message || "Start messaging..."}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Active Chat Panel */}
      <section className={cn(
        "flex-1 flex flex-col h-full bg-background relative",
        mobileView === "list" ? "hidden md:flex" : "flex"
      )}>
        {activeChat ? (
          <>
            {/* Header info */}
            <div className="h-16 border-b border-border bg-card px-4 flex items-center gap-3 shrink-0 z-10 shadow-sm justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="p-1 hover:bg-muted text-foreground rounded-full md:hidden cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted shrink-0">
                  {activeChat.photo_url ? (
                    <img src={activeChat.photo_url} alt={activeChat.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary font-bold text-sm">
                      {activeChat.type === "group" ? <Users className="h-5 w-5" /> : activeChat.name[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate leading-none">{activeChat.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1.5 capitalize">
                    {activeChat.type === "group" ? `${activeChat.participants.length} Travelers` : "Direct Message"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background flex flex-col">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                  <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
                  <h4 className="text-sm font-bold">Say Hello!</h4>
                  <p className="text-xs mt-0.5">Start the conversation with your travel companions.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.sender_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "self-end items-end" : "self-start items-start")}
                    >
                      {!isOwnMessage && activeChat.type === "group" && (
                        <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">{msg.sender_name}</span>
                      )}
                      
                      <div className={cn(
                        "rounded-2xl p-3.5 shadow-sm text-sm break-words",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card text-foreground rounded-tl-none border border-border"
                      )}>
                        {/* Render text messages */}
                        {msg.type === "text" && <p className="leading-relaxed">{msg.text}</p>}

                        {/* Render image attachments */}
                        {msg.type === "image" && (
                          <div className="rounded-xl overflow-hidden border border-border/20 max-w-[280px]">
                            <img src={msg.media_url} alt="Attachment" className="max-h-60 object-cover w-full" />
                          </div>
                        )}

                        {/* Render location/map messages */}
                        {msg.type === "location" && (
                          <div className="rounded-xl overflow-hidden border border-border/20 bg-card/65 text-foreground max-w-[280px]">
                            <div className="w-full h-40 relative">
                              {msg.media_url ? (
                                <iframe
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  style={{ border: 0 }}
                                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&q=${msg.media_url}`}
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-muted">
                                  <MapPin className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-muted/30">
                              <h5 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                {msg.text}
                              </h5>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${msg.media_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline font-bold mt-1 block"
                              >
                                View on Google Maps
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Render voice messages */}
                        {msg.type === "voice" && (
                          <div className="flex items-center gap-3 py-1 px-1 min-w-[150px]">
                            <button
                              onClick={() => handlePlayAudio(msg.id, msg.media_url!)}
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-colors",
                                isOwnMessage ? "bg-white text-primary" : "bg-primary text-white"
                              )}
                            >
                              {playingAudioId === msg.id ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current ml-0.5" />}
                            </button>
                            <div>
                              <p className="text-xs font-bold">Voice note</p>
                              <p className="text-[9px] opacity-80 mt-0.5">{msg.voice_duration || 0}s</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-[9px] text-muted-foreground mt-1 px-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="text-xs text-muted-foreground italic pl-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span>{typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input panel bar */}
            <div className="border-t border-border bg-card p-4 shrink-0 flex flex-col gap-2">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Image Attach Button */}
                <label className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors relative shrink-0">
                  <ImageIcon className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploadingMedia}
                  />
                </label>

                {/* Share Location Button */}
                <button
                  type="button"
                  onClick={() => setShareLocationOpen(true)}
                  className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all shrink-0 flex items-center justify-center"
                  aria-label="Share Location"
                >
                  <MapPin className="h-5 w-5" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    handleTyping();
                  }}
                  placeholder={isRecording ? "Recording voice note..." : "Message..."}
                  disabled={isRecording}
                  className="flex-1 rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none transition-all focus:border-primary"
                />

                {/* Voice Record / Send Button */}
                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow shrink-0 cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all",
                      isRecording ? "bg-destructive text-white animate-pulse" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isRecording ? <SquareIcon className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
              </form>

              {isRecording && (
                <div className="text-xs text-destructive font-semibold flex items-center gap-1.5 pl-12 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span>Recording voice message: {voiceDuration}s (Click square to send)</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
            <h3 className="text-lg font-bold">Your Conversations</h3>
            <p className="text-sm mt-1 max-w-sm">Select a discussion tab to start coordinating trip checklists, note suggestions, and photos in real-time.</p>
          </div>
        )}
      </section>

      {/* DIALOG: User Search (New Direct Chat) */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or name..."
                className="w-full rounded-2xl border border-border bg-input py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
              {searching && <p className="text-xs text-muted-foreground animate-pulse pl-1">Searching profiles...</p>}
              {!searching && searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground italic pl-1">No travelers found.</p>
              )}
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartDirectChat(user.id)}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border hover:border-primary/50 bg-card cursor-pointer hover:bg-muted/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-border bg-muted">
                      {user.photo_url ? (
                        <img src={user.photo_url} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary font-semibold text-xs">
                          {user.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Share Location */}
      <Dialog open={shareLocationOpen} onOpenChange={setShareLocationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Location on Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Search filter for presets */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                placeholder="Search trip destinations..."
                className="w-full rounded-2xl border border-border bg-input py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* List of Locations */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {PRESET_LOCATIONS.filter(loc => 
                loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
              ).map((loc) => (
                <div
                  key={loc.name}
                  onClick={() => handleShareLocation(loc.name, loc.coords)}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border hover:border-primary/50 bg-card cursor-pointer hover:bg-muted/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{loc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{loc.coords}</p>
                    </div>
                  </div>
                  <button className="text-[10px] bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg shadow-sm shrink-0">
                    Share
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Location sharing */}
            <div className="border-t border-border/40 pt-4 space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Or Share Custom Coordinates</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Location Name (e.g. Cafe Coorg)"
                  id="customLocName"
                  className="w-full rounded-xl border border-border bg-input py-2.5 px-3 text-xs outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Coordinates (e.g. 12.97,77.59)"
                  id="customLocCoords"
                  defaultValue={customCoords}
                  onChange={(e) => setCustomCoords(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input py-2.5 px-3 text-xs outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const nameEl = document.getElementById("customLocName") as HTMLInputElement;
                  const coordsEl = document.getElementById("customLocCoords") as HTMLInputElement;
                  if (nameEl?.value && coordsEl?.value) {
                    handleShareLocation(nameEl.value, coordsEl.value);
                  } else {
                    toast({
                      title: "Validation Error",
                      description: "Please enter both a name and coordinates.",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full bg-secondary text-secondary-foreground text-xs font-bold py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Share Custom Location
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

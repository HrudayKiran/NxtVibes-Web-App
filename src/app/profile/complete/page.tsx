"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, CheckCircle, AlertCircle, Camera, CheckSquare, Square, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { workersApi } from "@/lib/workersApi";
import { useToast } from "@/components/ui/toast";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const sanitizeUsername = (value: string): string => value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameOk, setUsernameOk] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prefill name & username from session metadata on mount
  useEffect(() => {
    const prefillData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      // Check if profile is already complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && profile.username) {
        router.push("/dashboard");
        return;
      }

      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
      if (user.email) {
        const defaultUsername = sanitizeUsername(user.email.split("@")[0]);
        setUsername(defaultUsername);
      }
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    };

    prefillData();
  }, [router]);

  // Username validation debouncer
  useEffect(() => {
    if (!username.trim()) {
      setUsernameError("Username is required");
      setUsernameOk(false);
      return;
    }

    const value = sanitizeUsername(username.trim());
    if (!USERNAME_REGEX.test(value)) {
      setUsernameError("3-20 characters: letters, numbers, or underscores only");
      setUsernameOk(false);
      return;
    }

    let active = true;
    const checkUsernameAvailability = async () => {
      setCheckingUsername(true);
      setUsernameError("");
      setUsernameOk(false);

      try {
        const response = await workersApi(`/account/check-username/${value}`, { method: "GET" });
        if (!active) return;

        if (response.available) {
          setUsernameOk(true);
        } else {
          setUsernameError("Username is already taken");
          setUsernameOk(false);
        }
      } catch (err) {
        if (!active) return;
        setUsernameError("Could not validate username. Please try again.");
      } finally {
        if (active) {
          setCheckingUsername(false);
        }
      }
    };

    const timer = setTimeout(checkUsernameAvailability, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  // Handle avatar upload via presigned URL
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    setUploadingAvatar(true);

    try {
      // 1. Request presigned URL from Workers API
      const { uploadUrl, objectKey } = await workersApi("/media/presigned-url", {
        method: "POST",
        body: {
          fileName: `${Date.now()}-${file.name}`,
          fileType: file.type,
        },
      });

      // 2. Put file to R2 directly
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage bucket.");
      }

      // 3. Construct final public CDN url
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${objectKey}`;
      setAvatarUrl(publicUrl);

      toast({
        title: "Avatar Uploaded",
        description: "Your profile photo is ready.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !usernameOk || !gender || !agreedToTerms || submitting) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth session expired.");

      // Upsert profile details in Supabase
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: fullName.trim(),
        username: sanitizeUsername(username.trim()),
        bio: bio.trim(),
        photo_url: avatarUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.message?.includes("profiles_username_key")) {
          setUsernameError("Username is already taken");
          setUsernameOk(false);
          setSubmitting(false);
          return;
        }
        throw error;
      }

      toast({
        title: "Profile Configured",
        description: "Welcome to the NxtVibes community!",
        variant: "success",
      });

      router.push("/dashboard");
    } catch (err: any) {
      toast({
        title: "Setup Failed",
        description: err.message || "An error occurred while setting up your profile.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = fullName.trim() && usernameOk && gender && agreedToTerms && !submitting;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background font-sans">
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-secondary/15 blur-[100px]" />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-premium md:p-10">
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Complete Profile</h1>
          <p className="text-sm text-muted-foreground">Setup your travel identity</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30 hover:border-primary transition-colors bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              ) : (
                <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Upload profile photo (Max 5MB)</span>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Username</label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                placeholder="username"
                className="w-full rounded-2xl border border-border bg-input py-3 pl-4 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="absolute right-3">
                {checkingUsername && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                {!checkingUsername && usernameOk && <CheckCircle className="h-4 w-4 text-success" />}
                {!checkingUsername && usernameError && <AlertCircle className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            {usernameError && <p className="text-xs text-destructive ml-1">{usernameError}</p>}
            {usernameOk && <p className="text-xs text-success ml-1">Username is available</p>}
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Gender</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`py-3 rounded-2xl border text-sm font-semibold transition-all cursor-pointer ${
                  gender === "male"
                    ? "bg-foreground text-background border-foreground font-bold shadow-md"
                    : "bg-input border-border text-foreground hover:bg-muted"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`py-3 rounded-2xl border text-sm font-semibold transition-all cursor-pointer ${
                  gender === "female"
                    ? "bg-foreground text-background border-foreground font-bold shadow-md"
                    : "bg-input border-border text-foreground hover:bg-muted"
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Bio (Optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your travel style..."
              rows={3}
              maxLength={150}
              className="w-full rounded-2xl border border-border bg-input py-3 px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Terms Checklist */}
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className="mt-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {agreedToTerms ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5" />}
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-95 transition-opacity disabled:opacity-50 mt-6 cursor-pointer"
          >
            {submitting ? "Finalizing..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}

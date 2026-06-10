"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Camera, Bell, Shield, Moon, Trash2, Save, 
  HelpCircle, Eye, LogOut, CheckCircle, Info 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { workersApi } from "@/lib/workersApi";
import { useThemeStore, ThemeMode } from "@/store/themeStore";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { themeMode, setThemeMode } = useThemeStore();

  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch current user and profile data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setFullName(data.name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.photo_url || null);
        setNotificationsEnabled(data.push_notifications_enabled ?? false);
      }
    };
    loadProfile();
  }, [router]);

  // Handle avatar upload via presigned URL to R2
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      // 1. Get presigned R2 upload URL
      const { uploadUrl, objectKey } = await workersApi("/media/presigned-url", {
        method: "POST",
        body: {
          fileName: `avatar-${Date.now()}-${file.name}`,
          fileType: file.type,
        },
      });

      // 2. Upload file
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload to bucket failed.");

      // 3. Set photo url
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${objectKey}`;
      setAvatarUrl(publicUrl);

      toast({
        title: "Avatar Uploaded",
        description: "Your new avatar is ready. Save settings to apply.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload avatar.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: fullName.trim(),
          bio: bio.trim(),
          photo_url: avatarUrl,
          push_notifications_enabled: notificationsEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Settings saved successfully.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save profile settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.");
    if (!confirmation) return;

    setDeleting(true);
    try {
      // Call workers DELETE endpoint
      const res = await workersApi("/account/delete", { method: "DELETE" });

      if (res.status === "success") {
        toast({
          title: "Account Deleted",
          description: "Your account and data have been permanently removed.",
          variant: "success",
        });
        await supabase.auth.signOut();
        router.push("/login");
      } else {
        throw new Error(res.message || "Failed to delete account");
      }
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Could not delete account. Contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 bg-background p-6 md:p-10 font-sans max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure profile details, notify preferences, and themes</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card Form */}
        <form onSubmit={handleSaveProfile} className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-premium space-y-6">
          <h3 className="text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Profile Settings
          </h3>

          {/* Avatar Edit */}
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer h-20 w-20 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              ) : (
                <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <Camera className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold">Change Profile Photo</h4>
              <p className="text-xs text-muted-foreground mt-1">Accepts PNG, JPG, or GIF. Max size 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 opacity-60">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Username (Static)</label>
              <input
                type="text"
                disabled
                value={profile?.username ? `@${profile.username}` : ""}
                className="w-full rounded-2xl border border-border bg-muted py-2.5 px-4 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your travel partners something about you..."
              rows={3}
              maxLength={150}
              className="w-full rounded-2xl border border-border bg-input py-2.5 px-4 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Toggle preferences */}
          <div className="pt-2">
            <h4 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider ml-1">System Preferences</h4>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Push Notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Receive alerts when new messages arrive.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
                  notificationsEnabled ? "bg-primary" : "bg-border"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    notificationsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer ml-auto"
          >
            <Save className="h-4.5 w-4.5" />
            {saving ? "Saving Updates..." : "Save Settings"}
          </button>
        </form>

        {/* Global configuration settings */}
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-premium space-y-6">
          <h3 className="text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
            <Moon className="h-5 w-5 text-secondary" /> Theme Preference
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className={`py-3 rounded-2xl border text-xs font-bold transition-all capitalize cursor-pointer ${
                  themeMode === mode
                    ? "bg-foreground border-foreground text-background font-bold shadow-md"
                    : "bg-input border-border text-foreground hover:bg-muted"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Delete Account */}
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 md:p-8 shadow-premium space-y-4">
          <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
            <Shield className="h-5 w-5" /> Safety & Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Deleting your account will permanently remove all of your saved itineraries, group messages, active colaborations, and media uploads. This is irreversible.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-2xl bg-destructive px-5 py-3 text-sm font-bold text-white hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-4.5 w-4.5" />
            {deleting ? "Deleting Account..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

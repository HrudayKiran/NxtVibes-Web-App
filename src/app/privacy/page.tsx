"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative font-sans p-6 md:p-10 max-w-3xl mx-auto w-full relative z-10 flex flex-col justify-between">
      <div>
        {/* Header link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Content Container */}
        <div className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md p-8 shadow-premium space-y-6">
          <div className="flex items-center gap-3 border-b border-border/20 pb-4 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
            <h3 className="font-extrabold text-foreground text-base mt-4">1. Information We Collect</h3>
            <p>
              We collect information that you provide directly to us when you create an account, plan trips, customize itineraries, share checklists, message other travelers, or communicate with our support. This includes profile info, trip details, and R2-loaded media attachments.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">2. Real-Time Collaboration & Database Sync</h3>
            <p>
              When you collaborate on itineraries (checklists, timeline days, notes), updates are broadcasted in real-time to other participants in the itinerary using Supabase's Realtime subscriptions.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">3. Cloudflare R2 Media Uploads</h3>
            <p>
              If you upload photos or record voice notes within the chat channels, these assets are loaded onto Cloudflare R2 bucket networks. You retain all ownership rights to media files uploaded.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">4. Cookie Policy & Local Storage</h3>
            <p>
              We use `localStorage` to save your Supabase JWT session credentials and active application preference settings (such as dark mode theme overrides) to keep you logged in across browser sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-12 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} NxtVibes. All rights reserved.
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
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
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Terms of Use</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
            <h3 className="font-extrabold text-foreground text-base mt-4">1. Agreement to Terms</h3>
            <p>
              By accessing or using NxtVibes, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to all of these terms, please do not use our services.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">2. Account Responsibility</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials (including Supabase email/password sessions) and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">3. Travel Collaboration & User Conduct</h3>
            <p>
              NxtVibes enables real-time collaboration on itineraries, checklists, timelines, and chat messages. You agree not to post, upload, or share any content that is unlawful, offensive, harmful, or violates the rights of others. We reserve the right to suspend accounts that violate these guidelines.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">4. Media Uploads & R2 Storage</h3>
            <p>
              You maintain full ownership of media files (photos, voice notes, attachments) uploaded to our Cloudflare R2 storage networks. By uploading, you grant NxtVibes a license to host and distribute the content solely for displaying it to you and your invited trip collaborators.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">5. Third-Party Integrations & Maps</h3>
            <p>
              Our application integrates third-party services including Google Maps API for route visualizer mapping. Your use of maps is subject to Google's Additional Terms of Service and Privacy Policy. NxtVibes is not responsible for any inaccuracies or issues arising from third-party APIs.
            </p>

            <h3 className="font-extrabold text-foreground text-base mt-4">6. Limitation of Liability</h3>
            <p>
              NxtVibes is provided "as is" and "as available". We do not guarantee that the services will be uninterrupted or error-free. In no event shall NxtVibes be liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use the services.
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

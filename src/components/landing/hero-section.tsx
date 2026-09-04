"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function HeroSection() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-background-secondary">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Logo */}
        <div className="animate-fade-in mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg
              className="w-10 h-10 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-2xl font-semibold text-foreground">Couple</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="animate-slide-up delay-100 text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
          Naomi & Micky
          <br />
          <span className="text-primary">forever & always</span>
        </h1>

        {/* Tagline */}
        <p className="animate-slide-up delay-200 text-xl md:text-2xl text-foreground-muted mb-8 max-w-2xl mx-auto leading-relaxed">
          Your private little corner of the internet — just for the two of you.
          Chat, share memories, and celebrate every moment together.
        </p>

        {/* Feature highlights */}
        <div className="animate-slide-up delay-300 flex flex-wrap justify-center gap-6 mb-12 text-sm text-foreground-muted">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
            </svg>
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Private by default</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>Share your timeline</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="animate-slide-up delay-400 flex flex-col sm:flex-row gap-4 justify-center">
          {isLoading ? (
            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : session?.user ? (
            <>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
              >
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-transparent text-foreground font-medium rounded-lg border border-border hover:border-foreground/20 hover:bg-foreground/5 transition-all duration-200"
              >
                Open Chat
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-transparent text-foreground font-medium rounded-lg border border-border hover:border-foreground/20 hover:bg-foreground/5 transition-all duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
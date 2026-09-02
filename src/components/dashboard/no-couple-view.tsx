"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NoCoupleViewProps {
  userName: string;
}

export function NoCoupleView({ userName }: NoCoupleViewProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {userName}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Connect with your partner to start sharing moments together.
        </p>
      </div>

      {/* Connect Card */}
      <Card className="border-rose-200 dark:border-rose-900/30 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-gray-900">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/30">
              <Users className="h-10 w-10 text-rose-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create or Join a Couple
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Start a private space with your partner to chat, share memories,
                and build your story together.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Button
                asChild
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Link href="/couple">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              You&apos;ll need an invite code from your partner, or you can create a new couple.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="text-2xl mb-2">💬</div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            Private Chat
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Send messages, photos, and reactions.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="text-2xl mb-2">📸</div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            Shared Memories
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Capture and save special moments.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="text-2xl mb-2">📅</div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            Timeline
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Build your relationship story.
          </p>
        </div>
      </div>
    </div>
  );
}

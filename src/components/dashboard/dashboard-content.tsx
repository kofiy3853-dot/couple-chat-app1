"use client";

import Link from "next/link";
import {
  MessageCircle,
  Camera,
  Calendar,
  Bell,
  Heart,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { QuickChatCard } from "./quick-chat-card";
import { RecentMessages } from "./recent-messages";
import { MemoriesPreview } from "./memories-preview";
import { TimelinePreview } from "./timeline-preview";
import { NotificationsPreview } from "./notifications-preview";
import { AnniversaryWidget } from "./anniversary-widget";

interface Partner {
  name: string | null;
  image: string | null;

}

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
}

interface Memory {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  date: string;
}

interface DashboardContentProps {
  userName: string;
  partner: Partner;
  daysTogether: number | null;
  messageCount: number;
  memoryCount: number;
  conversationId: string | null;
  recentMessages: Message[];
  recentMemories: Memory[];
  unreadNotifications: number;
  anniversaryDate: string | null;
}

export function DashboardContent({
  userName,
  partner,
  daysTogether,
  messageCount,
  memoryCount,
  conversationId,
  recentMessages,
  recentMemories,
  unreadNotifications,
  anniversaryDate,
}: DashboardContentProps) {
  const partnerInitials = partner.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Couple Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-3">
            <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-900 ring-2 ring-rose-400">
              <AvatarFallback className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-sm font-semibold">
                {userName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-900 ring-2 ring-rose-400">
              <AvatarImage src={partner.image || undefined} alt={partner.name || ""} />
              <AvatarFallback className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-sm font-semibold">
                {partnerInitials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {userName} & {partner.name || "Partner"}
            </h1>
            {daysTogether !== null && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                Together for {daysTogether.toLocaleString()} {daysTogether === 1 ? "day" : "days"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/notifications">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-medium flex items-center justify-center">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Sparkles className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Chat Card */}
      <QuickChatCard
        partnerName={partner.name}
        conversationId={conversationId}
        lastMessage={
          recentMessages.length > 0
            ? {
                content: recentMessages[0].content,
                senderName: recentMessages[0].sender.name,
                createdAt: recentMessages[0].createdAt,
              }
            : null
        }
      />

      <AnniversaryWidget 
        daysTogether={daysTogether ?? 0} 
        anniversaryDate={anniversaryDate} 
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20">
              <MessageCircle className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {messageCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20">
              <Camera className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {memoryCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Memories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Messages */}
        <div className="lg:col-span-2 space-y-6">
          <RecentMessages
            messages={recentMessages}
            conversationId={conversationId}
          />
        </div>

        {/* Right Column - Sidebar Content */}
        <div className="space-y-6">
          <MemoriesPreview memories={recentMemories} />
          <TimelinePreview />
          <NotificationsPreview unreadCount={unreadNotifications} />
        </div>
      </div>
    </div>
  );
}

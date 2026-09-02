"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
}

interface RecentMessagesProps {
  messages: Message[];
  conversationId: string | null;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecentMessages({ messages, conversationId }: RecentMessagesProps) {
  if (messages.length === 0) {
    return (
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-rose-500" />
            Recent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <MessageCircle className="h-7 w-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              No messages yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-[240px]">
              Start a conversation with your partner to see messages here.
            </p>
            <Button asChild size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
              <Link href="/chat">
                Send first message
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-rose-500" />
          Recent Messages
        </CardTitle>
        {conversationId && (
          <Link
            href="/chat"
            className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {messages.map((msg) => {
            const initials = msg.sender.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?";

            return (
              <div
                key={msg.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={msg.sender.image || undefined}
                    alt={msg.sender.name || ""}
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {msg.sender.name || "Unknown"}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-0.5">
                    {msg.type === "IMAGE" ? "📷 Photo" : msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

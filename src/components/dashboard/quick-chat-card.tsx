"use client";

import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickChatCardProps {
  partnerName: string | null;
  conversationId: string | null;
  lastMessage: {
    content: string;
    senderName: string | null;
    createdAt: string;
  } | null;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function QuickChatCard({
  partnerName,
  conversationId,
  lastMessage,
}: QuickChatCardProps) {
  return (
    <Card className="border-rose-200 dark:border-rose-900/30 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-gray-900">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                <MessageCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Continue your conversation
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chat with {partnerName || "your partner"}
                </p>
              </div>
            </div>

            {lastMessage && (
              <div className="ml-12 pl-4 border-l-2 border-rose-200 dark:border-rose-800">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                  {lastMessage.senderName}: {lastMessage.content}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatTimeAgo(lastMessage.createdAt)}
                </p>
              </div>
            )}

            {!lastMessage && (
              <div className="ml-12 pl-4 border-l-2 border-rose-200 dark:border-rose-800">
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No messages yet. Say hello!
                </p>
              </div>
            )}
          </div>

          <Button
            asChild
            size="sm"
            className="bg-rose-500 hover:bg-rose-600 text-white mt-1"
          >
            <Link href="/chat">
              Open Chat
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

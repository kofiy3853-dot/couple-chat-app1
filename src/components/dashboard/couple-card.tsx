import { Heart, Calendar, MessageCircle, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Partner {
  name?: string | null;
  image?: string | null;
}

interface CoupleCardProps {
  partner: Partner;
  togetherSince?: Date | null;
  messageCount?: number;
  memoryCount?: number;
}

export function CoupleCard({
  partner,
  togetherSince,
  messageCount = 0,
  memoryCount = 0,
}: CoupleCardProps) {
  const partnerInitials = partner.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const daysTogether = togetherSince
    ? Math.floor(
        (new Date().getTime() - new Date(togetherSince).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Card className="overflow-hidden border-rose-100 dark:border-rose-900/30">
      <div className="h-2 bg-gradient-to-r from-rose-400 to-pink-500" />
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
          Your Couple
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-rose-200 dark:border-rose-800">
            <AvatarImage src={partner.image || undefined} alt={partner.name || ""} />
            <AvatarFallback className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-lg font-semibold">
              {partnerInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center">
            <Heart className="h-5 w-5 text-rose-400" fill="currentColor" />
          </div>
          <Avatar className="h-16 w-16 border-2 border-rose-200 dark:border-rose-800">
            <AvatarFallback className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-lg font-semibold">
              You
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {partner.name || "Your Partner"}
          </p>
          {daysTogether !== null && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Together for {daysTogether} {daysTogether === 1 ? "day" : "days"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <MessageCircle className="h-4 w-4 text-rose-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {messageCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <Camera className="h-4 w-4 text-rose-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {memoryCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Memories</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1 bg-rose-500 hover:bg-rose-600 text-white">
            <Link href="/chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/memories">
              <Camera className="h-4 w-4 mr-2" />
              Memories
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

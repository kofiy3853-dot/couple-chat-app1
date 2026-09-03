"use client";

import { useEffect, useState } from "react";
import { Heart, Sunrise, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LOVE_MESSAGES = [
  "Every moment with you feels like a beautiful dream I never want to wake up from. 💕",
  "You are my favorite notification, my favorite distraction, and my favorite everything. 🌹",
  "In a world full of noise, you are my favorite song. 🎵",
  "I fell in love with you. Still falling. Don't plan on stopping. ❤️",
  "You make every ordinary moment feel like magic. ✨",
  "My heart found its home the moment it found you. 🏠💗",
  "You're the reason I smile for no reason. 😊",
  "Together is my favorite place to be. 🫶",
  "You are my today and all of my tomorrows. 🌅",
  "Loving you is the best adventure I've ever been on. 🌍",
  "You had me at hello, and you still have me every single day. 💫",
  "You are the poem I never knew how to write. 📝💕",
  "I choose you. Every day. Every moment. Always. 💍",
  "With you, I am home. 🌸",
  "You light up every room you walk into — especially my heart. 💡❤️",
  "I love you more than yesterday, but less than tomorrow. ∞",
  "You're not just my partner, you're my best friend and my greatest love. 🤝❤️",
  "Every love story is beautiful, but ours is my favorite. 📖💕",
  "You make my heart do silly little things. 💓",
  "Being with you is the easiest thing I've ever done. 🕊️",
];

const MORNING_MESSAGES = [
  "Good morning, love! May your day be as beautiful as you are. ☀️💕",
  "Rise and shine! Wishing you the most wonderful day, filled with joy and love. 🌅",
  "Good morning! Every day is better because you're in it. 🌸",
  "Wake up beautiful! The world is a little brighter today because of you. ✨",
  "Good morning! Sending you a warm hug to start your day right. 🤗💛",
  "A new day, a new chance to remind you how much you're loved. Good morning! ❤️🌤️",
  "Good morning! I hope your coffee is strong and your love is stronger. ☕💕",
  "Wishing you a morning as sweet and lovely as you are. 🍯🌻",
];

function getIsMorning(): boolean {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 12;
}

function getMessageIndex(): number {
  const now = new Date();
  const minuteSlot = Math.floor((now.getHours() * 60 + now.getMinutes()) / 5);
  return minuteSlot % LOVE_MESSAGES.length;
}

function getMorningMessageIndex(): number {
  const day = new Date().getDate();
  return day % MORNING_MESSAGES.length;
}

interface LoveMessageWidgetProps {
  userName: string;
  partnerName: string | null;
}

export function LoveMessageWidget({ userName, partnerName }: LoveMessageWidgetProps) {
  const [isMorning, setIsMorning] = useState(false);
  const [loveMessage, setLoveMessage] = useState("");
  const [morningMessage, setMorningMessage] = useState("");
  const [fadeIn, setFadeIn] = useState(true);

  const updateMessages = () => {
    setIsMorning(getIsMorning());
    setLoveMessage(LOVE_MESSAGES[getMessageIndex()]);
    setMorningMessage(MORNING_MESSAGES[getMorningMessageIndex()]);
  };

  useEffect(() => {
    updateMessages();

    const now = new Date();
    const msUntilNextSlot =
      (5 - (now.getMinutes() % 5)) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => {
        updateMessages();
        setFadeIn(true);
      }, 400);

      const interval = setInterval(() => {
        setFadeIn(false);
        setTimeout(() => {
          updateMessages();
          setFadeIn(true);
        }, 400);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }, msUntilNextSlot);

    return () => clearTimeout(timeout);
  }, []);

  const partner = partnerName?.split(" ")[0] || "love";

  return (
    <div className="space-y-3">
      {isMorning && (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/40 shadow-sm">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-amber-200/40 dark:bg-amber-700/20 blur-2xl pointer-events-none" />
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex-shrink-0 mt-0.5">
              <Sunrise className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                Good Morning
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                Hey <span className="font-medium text-amber-600 dark:text-amber-400">{userName}</span>!{" "}
                {morningMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-fuchsia-950/40 shadow-sm">
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-rose-200/40 dark:bg-rose-800/20 blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-pink-200/30 dark:bg-pink-800/20 blur-xl pointer-events-none" />
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex-shrink-0 mt-0.5">
            <Heart className="h-5 w-5 text-rose-500 dark:text-rose-400" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                A Message for {partner}
              </p>
              <Sparkles className="h-3 w-3 text-rose-400 dark:text-rose-500 flex-shrink-0" />
            </div>
            <p
              className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed italic transition-opacity duration-[400ms]"
              style={{ opacity: fadeIn ? 1 : 0 }}
            >
              "{loveMessage}"
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-300 dark:bg-rose-600 animate-pulse" />
              Updates every 5 minutes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

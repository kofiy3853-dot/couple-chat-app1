"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Flame, Heart, Sparkles, RotateCcw, Share2 } from "lucide-react";

const truths = [
  "What's your favorite memory of us?",
  "What's something I do that makes you smile?",
  "When did you first know you loved me?",
  "What's a secret talent you have that I don't know about?",
  "What's your biggest fear about our relationship?",
  "What's the most romantic thing I've ever done?",
  "If you could change one thing about our first date, what would it be?",
  "What's something you've always wanted to tell me but haven't?",
  "What's your favorite physical feature of mine?",
  "What song reminds you of us?",
  "What's the kindest thing I've ever done for you?",
  "What's a dream you have for our future together?",
  "What's something that made you jealous?",
  "What's your favorite thing we do together?",
  "When do you feel most loved by me?",
  "What's a small thing I do that means a lot to you?",
  "What's something you admire about me?",
  "What's the funniest memory we share?",
  "What's a goal you want us to achieve together?",
  "What's something you're grateful for in our relationship?",
];

const dares = [
  "Give your partner a 30-second hug",
  "Kiss your partner on the forehead",
  "Tell your partner 3 things you love about them",
  "Do your best impression of your partner",
  "Sing a love song to your partner",
  "Give your partner a compliment sandwich (3 compliments in a row)",
  "Dance with your partner for 1 minute",
  "Hold hands and stare into each other's eyes for 30 seconds",
  "Write a short love poem for your partner",
  "Give your partner a shoulder massage for 1 minute",
  "Share your favorite photo of you two and explain why",
  "Say 'I love you' in 3 different languages",
  "Tell your partner what you'd do differently if you met them again",
  "Imitate how your partner acts when they're sleepy",
  "Create a new handshake with your partner",
  "Whisper something sweet in your partner's ear",
  "Act out your first date together in 30 seconds",
  "Give your partner a piggyback ride (or offer one)",
  "Make up a new couple nickname right now",
  "Do a silly dance and make your partner laugh",
];

export function TruthOrDare({ onBack }: { onBack: () => void }) {
  const [completed, setCompleted] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null);
  const [challengeType, setChallengeType] = useState<"truth" | "dare" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<{ type: "truth" | "dare"; challenge: string; didIt: boolean }[]>([]);

  const getRandomChallenge = useCallback((type: "truth" | "dare") => {
    const pool = type === "truth" ? truths : dares;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const handleChoice = (type: "truth" | "dare") => {
    const challenge = getRandomChallenge(type);
    setCurrentChallenge(challenge);
    setChallengeType(type);
    setShowResult(false);
    setDone(false);
  };

  const handleComplete = (didIt: boolean) => {
    setShowResult(true);
    setDone(true);
    if (didIt) {
      setCompleted((c) => c + 1);
    } else {
      setSkipped((s) => s + 1);
    }
    setHistory((h) => [...h, { type: challengeType!, challenge: currentChallenge!, didIt }]);
  };

  const handleNext = () => {
    setCurrentChallenge(null);
    setChallengeType(null);
    setShowResult(false);
    setDone(false);
  };

  const total = completed + skipped;

  return (
    <GameLayout title="Truth or Dare" subtitle="Take on challenges together!" onBack={onBack}>
      <div className="space-y-6">
        {/* Score */}
        <div className="flex gap-3">
          <Card className="flex-1">
            <CardContent className="p-3 text-center">
              <Badge variant="secondary" className="bg-green-50 text-green-600">
                <Heart className="h-3 w-3 mr-1" />{completed} completed
              </Badge>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-3 text-center">
              <Badge variant="secondary" className="bg-gray-50 text-gray-600">
                {skipped} skipped
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Challenge */}
        {currentChallenge ? (
          <Card className={cn(
            "border-2",
            challengeType === "truth" ? "border-blue-500 bg-blue-50/50" : "border-orange-500 bg-orange-50/50"
          )}>
            <CardContent className="p-6 text-center">
              <Badge className={cn("mb-4", challengeType === "truth" ? "bg-blue-500" : "bg-orange-500")}>
                {challengeType === "truth" ? "TRUTH" : "DARE"}
              </Badge>
              <p className="text-lg font-medium text-gray-900 mb-6">{currentChallenge}</p>
              {!done ? (
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleComplete(false)}
                  >
                    Skip
                  </Button>
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleComplete(true)}
                  >
                    <Heart className="h-4 w-4 mr-2" /> Did it!
                  </Button>
                </div>
              ) : (
                <Button onClick={handleNext} className="w-full">
                  Next Challenge →
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-6">
                {total === 0 ? "Pick your challenge!" : `You've done ${completed} challenges so far`}
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 px-8 text-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleChoice("truth")}
                >
                  <Flame className="h-5 w-5 mr-2" /> Truth
                </Button>
                <Button
                  size="lg"
                  className="h-20 px-8 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => handleChoice("dare")}
                >
                  <Sparkles className="h-5 w-5 mr-2" /> Dare
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">Recent challenges</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {history.slice().reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className={cn("text-xs", h.type === "truth" ? "text-blue-600" : "text-orange-600")}>
                      {h.type === "truth" ? "T" : "D"}
                    </Badge>
                    <span className="text-gray-700 truncate flex-1">{h.challenge}</span>
                    {h.didIt ? (
                      <Heart className="h-3 w-3 text-green-500 shrink-0" />
                    ) : (
                      <span className="text-xs text-gray-400 shrink-0">skipped</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {total >= 5 && (
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-4 text-center">
              <p className="font-medium text-gray-900 mb-2">
                You completed {completed} out of {total} challenges!
              </p>
              <p className="text-sm text-gray-500 mb-3">
                {completed >= 4 ? "You two are amazing together! 💕" : "Keep going, have fun together! 🎉"}
              </p>
              <Button variant="outline" size="sm" onClick={() => { setCompleted(0); setSkipped(0); setHistory([]); }}>
                <RotateCcw className="h-4 w-4 mr-2" /> Start Over
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </GameLayout>
  );
}

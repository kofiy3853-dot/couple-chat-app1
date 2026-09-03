"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Flame, Heart, Sparkles, RotateCcw } from "lucide-react";

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

interface Player {
  name: string;
  truths: number;
  dares: number;
}

export function TruthOrDare({ onBack }: { onBack: () => void }) {
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [players] = useState<Player[]>([
    { name: "Player 1", truths: 0, dares: 0 },
    { name: "Player 2", truths: 0, dares: 0 },
  ]);
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null);
  const [challengeType, setChallengeType] = useState<"truth" | "dare" | null>(null);
  const [completed, setCompleted] = useState(false);
  const [round, setRound] = useState(1);

  const getRandomChallenge = useCallback((type: "truth" | "dare") => {
    const pool = type === "truth" ? truths : dares;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const handleChoice = (type: "truth" | "dare") => {
    const challenge = getRandomChallenge(type);
    setCurrentChallenge(challenge);
    setChallengeType(type);
    setCompleted(false);
  };

  const handleComplete = (didIt: boolean) => {
    setCompleted(true);
    if (didIt) {
      players[currentPlayer][challengeType === "truth" ? "truths" : "dares"]++;
    }
  };

  const handleNext = () => {
    setCurrentPlayer((prev) => (prev === 0 ? 1 : 0));
    setCurrentChallenge(null);
    setChallengeType(null);
    setCompleted(false);
    if (currentPlayer === 1) setRound((r) => r + 1);
  };

  return (
    <GameLayout title="Truth or Dare" subtitle={`Round ${round} — ${players[currentPlayer].name}'s turn`} onBack={onBack}>
      <div className="space-y-6">
        {/* Score */}
        <div className="flex gap-3">
          {players.map((p, i) => (
            <Card key={i} className={cn("flex-1", i === currentPlayer && "ring-2 ring-rose-500")}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{i === currentPlayer ? "← Your turn" : p.name}</p>
                <div className="flex justify-center gap-3">
                  <Badge variant="secondary" className="bg-red-50 text-red-600">
                    <Flame className="h-3 w-3 mr-1" />{p.truths} truths
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-600">
                    <Sparkles className="h-3 w-3 mr-1" />{p.dares} dares
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
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
              {!completed ? (
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
                  Next Turn →
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-6">Choose your challenge, {players[currentPlayer].name}!</p>
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
      </div>
    </GameLayout>
  );
}

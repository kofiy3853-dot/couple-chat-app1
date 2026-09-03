"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { RotateCcw, Trophy, Share2 } from "lucide-react";

interface RatherQuestion {
  optionA: string;
  optionB: string;
}

const ratherQuestions: RatherQuestion[] = [
  { optionA: "Always be 10 minutes late", optionB: "Always be 30 minutes early" },
  { optionA: "Cook dinner together every night", optionB: "Order takeout every night" },
  { optionA: "Have a movie marathon at home", optionB: "Go to a fancy dinner" },
  { optionA: "Text all day but only call once a week", optionB: "Call every day but text rarely" },
  { optionA: "Travel the world together", optionB: "Build your dream home together" },
  { optionA: "Always say what you mean", optionB: "Always say what others want to hear" },
  { optionA: "Never argue again", optionB: "Never have a boring conversation" },
  { optionA: "Read each other's minds", optionB: "Always know the perfect gift" },
  { optionA: "Have a pet together", optionB: "Have a garden together" },
  { optionA: "Be stuck on a desert island together", optionB: "Be stuck in an elevator together" },
  { optionA: "Only listen to love songs", optionB: "Only watch romantic movies" },
  { optionA: "Have a weekly date night", optionB: "Have a monthly adventure day" },
  { optionA: "Share all passwords", optionB: "Keep some things private" },
  { optionA: "Always agree on what to eat", optionB: "Always agree on what to watch" },
  { optionA: "Never have to do dishes", optionB: "Never have to do laundry" },
  { optionA: "Live in the city", optionB: "Live in the countryside" },
  { optionA: "Have a private chef", optionB: "Have a private driver" },
  { optionA: "Always be honest, even if it hurts", optionB: "Always be kind, even if it's not fully honest" },
  { optionA: "Only communicate through emojis", optionB: "Only communicate through song lyrics" },
  { optionA: "Relive your first date", optionB: "Plan your dream wedding" },
];

export function WouldYouRather({ onBack }: { onBack: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [choices, setChoices] = useState<("A" | "B")[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledQuestions] = useState(() =>
    [...ratherQuestions].sort(() => Math.random() - 0.5).slice(0, 10)
  );

  const question = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

  const handleChoice = (choice: "A" | "B") => {
    const newChoices = [...choices, choice];
    setChoices(newChoices);
    if (currentQuestion + 1 >= shuffledQuestions.length) {
      setGameOver(true);
    } else {
      setCurrentQuestion((q) => q + 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setChoices([]);
    setGameOver(false);
  };

  const shareText = `I answered ${shuffledQuestions.length} Would You Rather questions! What would you pick? 💕`;

  if (gameOver) {
    const aCount = choices.filter((c) => c === "A").length;
    const bCount = choices.filter((c) => c === "B").length;

    return (
      <GameLayout title="Would You Rather" onBack={onBack}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Results!</h2>
              <p className="text-gray-500 mb-6">
                You picked Option A {aCount} times and Option B {bCount} times
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mb-4"
                onClick={() => navigator.clipboard?.writeText(shareText)}
              >
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">Your picks</p>
              <div className="space-y-3">
                {shuffledQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className={cn("shrink-0", choices[i] === "A" ? "text-purple-600" : "text-pink-600")}>
                      {choices[i]}
                    </Badge>
                    <p className="text-gray-700">
                      {choices[i] === "A" ? q.optionA : q.optionB}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">Back to Games</Button>
            <Button onClick={handleRestart} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" /> Play Again
            </Button>
          </div>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Would You Rather" subtitle="Pick the one you prefer!" onBack={onBack}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {shuffledQuestions.length}
          </span>
          <Badge variant="secondary">Picked: {choices.length}</Badge>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center">
          {shuffledQuestions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i < choices.length
                  ? choices[i] === "A" ? "bg-purple-500" : "bg-pink-500"
                  : i === currentQuestion
                    ? "bg-gray-400"
                    : "bg-gray-200"
              )}
            />
          ))}
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => handleChoice("A")}
            className="p-6 rounded-xl border-2 border-purple-200 text-left transition-all hover:border-purple-500 hover:bg-purple-50 active:scale-[0.98]"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-3">
              Option A
            </span>
            <p className="text-lg font-medium text-gray-900">{question.optionA}</p>
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-400 font-medium">OR</span>
          </div>

          <button
            onClick={() => handleChoice("B")}
            className="p-6 rounded-xl border-2 border-pink-200 text-left transition-all hover:border-pink-500 hover:bg-pink-50 active:scale-[0.98]"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-3">
              Option B
            </span>
            <p className="text-lg font-medium text-gray-900">{question.optionB}</p>
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

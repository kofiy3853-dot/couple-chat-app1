"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { GitBranch, RotateCcw, Trophy } from "lucide-react";

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
  const [player1Choice, setPlayer1Choice] = useState<"A" | "B" | null>(null);
  const [player2Choice, setPlayer2Choice] = useState<"A" | "B" | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [matches, setMatches] = useState(0);
  const [round, setRound] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [shuffledQuestions] = useState(() =>
    [...ratherQuestions].sort(() => Math.random() - 0.5).slice(0, 10)
  );

  const question = shuffledQuestions[currentQuestion];

  const handleChoice = useCallback((choice: "A" | "B") => {
    if (currentPlayer === 1) {
      setPlayer1Choice(choice);
      setCurrentPlayer(2);
    } else {
      setPlayer2Choice(choice);
      setShowResult(true);
      if (player1Choice === choice) {
        setMatches((m) => m + 1);
      }
    }
  }, [currentPlayer, player1Choice]);

  const handleNext = () => {
    if (currentQuestion + 1 >= shuffledQuestions.length) {
      setCurrentQuestion(shuffledQuestions.length);
    } else {
      setCurrentQuestion((q) => q + 1);
      setPlayer1Choice(null);
      setPlayer2Choice(null);
      setCurrentPlayer(1);
      setShowResult(false);
      setRound((r) => r + 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setPlayer1Choice(null);
    setPlayer2Choice(null);
    setCurrentPlayer(1);
    setMatches(0);
    setRound(1);
    setShowResult(false);
  };

  if (currentQuestion >= shuffledQuestions.length) {
    const percentage = Math.round((matches / shuffledQuestions.length) * 100);
    return (
      <GameLayout title="Would You Rather" onBack={onBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className={cn("h-16 w-16 mx-auto mb-4", percentage >= 70 ? "text-yellow-500" : "text-gray-400")} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {percentage >= 70 ? "You're so in sync! 💕" : percentage >= 50 ? "Pretty close! 🤔" : "Opposites attract! 😄"}
            </h2>
            <p className="text-gray-500 mb-4">
              You matched on {matches} out of {shuffledQuestions.length} questions ({percentage}%)
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onBack}>Back to Games</Button>
              <Button onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" /> Play Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Would You Rather" subtitle={`Round ${round} — Player ${currentPlayer}'s turn`} onBack={onBack}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {shuffledQuestions.length}
          </span>
          <Badge variant="secondary">Matches: {matches}</Badge>
        </div>

        {showResult && (
          <Card className={cn(
            "border-2",
            player1Choice === player2Choice ? "border-green-500 bg-green-50/50" : "border-orange-500 bg-orange-50/50"
          )}>
            <CardContent className="p-4 text-center">
              <p className="font-medium text-gray-900">
                {player1Choice === player2Choice
                  ? "You both chose the same! You're in sync! 💕"
                  : "Different choices! Opposites attract! 😄"}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          <button
            onClick={() => !showResult && handleChoice("A")}
            disabled={showResult || currentPlayer === 2 && player1Choice !== null}
            className={cn(
              "p-6 rounded-xl border-2 text-left transition-all",
              !showResult
                ? "border-purple-200 hover:border-purple-500 hover:bg-purple-50 active:scale-[0.98]"
                : player1Choice === "A" && player2Choice === "A"
                  ? "border-green-500 bg-green-50"
                  : player1Choice === "A"
                    ? "border-blue-500 bg-blue-50"
                    : player2Choice === "A"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 opacity-50"
            )}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-3">
              Option A
            </span>
            <p className="text-lg font-medium text-gray-900">{question.optionA}</p>
            {showResult && player1Choice === "A" && (
              <Badge className="mt-2 bg-blue-500">Player 1 chose this</Badge>
            )}
            {showResult && player2Choice === "A" && (
              <Badge className="mt-2 bg-rose-500">Player 2 chose this</Badge>
            )}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-400 font-medium">OR</span>
          </div>

          <button
            onClick={() => !showResult && handleChoice("B")}
            disabled={showResult || currentPlayer === 2 && player1Choice !== null}
            className={cn(
              "p-6 rounded-xl border-2 text-left transition-all",
              !showResult
                ? "border-pink-200 hover:border-pink-500 hover:bg-pink-50 active:scale-[0.98]"
                : player1Choice === "B" && player2Choice === "B"
                  ? "border-green-500 bg-green-50"
                  : player1Choice === "B"
                    ? "border-blue-500 bg-blue-50"
                    : player2Choice === "B"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 opacity-50"
            )}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-3">
              Option B
            </span>
            <p className="text-lg font-medium text-gray-900">{question.optionB}</p>
            {showResult && player1Choice === "B" && (
              <Badge className="mt-2 bg-blue-500">Player 1 chose this</Badge>
            )}
            {showResult && player2Choice === "B" && (
              <Badge className="mt-2 bg-rose-500">Player 2 chose this</Badge>
            )}
          </button>
        </div>

        {showResult && (
          <Button onClick={handleNext} className="w-full">
            {currentQuestion + 1 >= shuffledQuestions.length ? "See Results" : "Next Question →"}
          </Button>
        )}
      </div>
    </GameLayout>
  );
}

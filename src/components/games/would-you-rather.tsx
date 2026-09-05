"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { RotateCcw, Trophy, Share2, Users } from "lucide-react";

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

interface GameSocketActions {
  startGame: (conversationId: string, game: string, payload?: unknown) => void;
  makeChoice: (conversationId: string, game: string, payload: unknown) => void;
  sendQuestion: (conversationId: string, game: string, question: string, payload?: unknown) => void;
  sendAnswer: (conversationId: string, game: string, completed: boolean, payload?: unknown) => void;
  endGame: (conversationId: string, game: string) => void;
}

interface WouldYouRatherProps {
  onBack: () => void;
  conversationId: string | null;
  userId: string;
  connected: boolean;
  socketActions: GameSocketActions;
  onRegisterHandlers: (key: string, fn: (...args: unknown[]) => void) => void;
}

export function WouldYouRather({ onBack, conversationId, userId, connected, socketActions, onRegisterHandlers }: WouldYouRatherProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [choices, setChoices] = useState<("A" | "B")[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [partnerChoices, setPartnerChoices] = useState<Record<number, "A" | "B">>({});
  const [partnerName, setPartnerName] = useState("");
  const [shuffledQuestions] = useState(() =>
    [...ratherQuestions].sort(() => Math.random() - 0.5).slice(0, 10)
  );

  useEffect(() => {
    onRegisterHandlers("onGameChoiceMade", (data: unknown) => {
      const d = data as { fromUserId: string; fromUserName: string; game: string; payload?: { questionIndex: number; pick: "A" | "B" } };
      if (d.fromUserId === userId || d.game !== "would-you-rather" || !d.payload) return;
      setPartnerName(d.fromUserName);
      setPartnerChoices((prev) => ({ ...prev, [d.payload!.questionIndex]: d.payload!.pick }));
    });

    onRegisterHandlers("onGameEnded", (data: unknown) => {
      const d = data as { fromUserId: string; game: string };
      if (d.fromUserId === userId || d.game !== "would-you-rather") return;
    });
  }, [userId, onRegisterHandlers]);

  const question = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

  const handleChoice = (choice: "A" | "B") => {
    const newChoices = [...choices, choice];
    setChoices(newChoices);
    if (conversationId) {
      socketActions.makeChoice(conversationId, "would-you-rather", { questionIndex: currentQuestion, pick: choice });
    }
    if (currentQuestion + 1 >= shuffledQuestions.length) {
      setGameOver(true);
      if (conversationId) socketActions.endGame(conversationId, "would-you-rather");
    } else {
      setCurrentQuestion((q) => q + 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setChoices([]);
    setGameOver(false);
    setPartnerChoices({});
  };

  const shareText = `I answered ${shuffledQuestions.length} Would You Rather questions! What would you pick? 💕`;

  if (!conversationId) {
    return (
      <GameLayout title="Would You Rather" onBack={onBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No partner connected</h2>
            <p className="text-gray-500 mb-4">You need to be in a couple to play Would You Rather.</p>
            <Button variant="outline" onClick={onBack}>Back to Games</Button>
          </CardContent>
        </Card>
      </GameLayout>
    );
  }

  if (gameOver) {
    const aCount = choices.filter((c) => c === "A").length;
    const bCount = choices.filter((c) => c === "B").length;
    const partnerA = Object.values(partnerChoices).filter((c) => c === "A").length;
    const partnerB = Object.values(partnerChoices).filter((c) => c === "B").length;
    const agreeCount = choices.filter((c, i) => partnerChoices[i] === c).length;

    return (
      <GameLayout title="Would You Rather" onBack={onBack}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Results!</h2>
              <div className="flex gap-8 justify-center mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">You</p>
                  <p className="text-lg font-bold text-purple-600">A: {aCount} · B: {bCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{partnerName || "Partner"}</p>
                  <p className="text-lg font-bold text-pink-600">A: {partnerA} · B: {partnerB}</p>
                </div>
              </div>
              <p className="text-gray-500 mb-4">
                You agreed on {agreeCount}/{choices.length} questions! 💕
              </p>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(shareText)}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">Compare picks</p>
              <div className="space-y-3">
                {shuffledQuestions.map((q, i) => {
                  const myPick = choices[i];
                  const partnerPick = partnerChoices[i];
                  const agreed = myPick === partnerPick;
                  return (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium text-gray-700 mb-1">
                        {q.optionA} <span className="text-gray-400">vs</span> {q.optionB}
                      </p>
                      <div className="flex gap-4 text-xs">
                        <span className={cn("font-medium", myPick === "A" ? "text-purple-600" : "text-pink-600")}>
                          You: {myPick}
                        </span>
                        {partnerPick && (
                          <span className={cn("font-medium", partnerPick === "A" ? "text-purple-600" : "text-pink-600")}>
                            {partnerName}: {partnerPick}
                          </span>
                        )}
                        {!partnerPick && <span className="text-gray-400">{partnerName || "Partner"}: waiting...</span>}
                        {partnerPick && (
                          <span className={agreed ? "text-green-600" : "text-gray-400"}>
                            {agreed ? "Same! ✓" : "Different"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
    <GameLayout title="Would You Rather" subtitle={`Pick the one you prefer! · ${connected ? "Connected" : "Connecting..."}`} onBack={onBack}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {shuffledQuestions.length}
          </span>
          <Badge variant="secondary">Picked: {choices.length}</Badge>
        </div>

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
            className="p-6 rounded-xl border-2 border-purple-200 text-left transition-all hover:border-purple-500 hover:bg-purple-50 active:scale-[0.98] relative"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-3">
              Option A
            </span>
            <p className="text-lg font-medium text-gray-900">{question.optionA}</p>
            {partnerChoices[currentQuestion] === "A" && (
              <span className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {partnerName || "Partner"} picked this
              </span>
            )}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-400 font-medium">OR</span>
          </div>

          <button
            onClick={() => handleChoice("B")}
            className="p-6 rounded-xl border-2 border-pink-200 text-left transition-all hover:border-pink-500 hover:bg-pink-50 active:scale-[0.98] relative"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-medium mb-3">
              Option B
            </span>
            <p className="text-lg font-medium text-gray-900">{question.optionB}</p>
            {partnerChoices[currentQuestion] === "B" && (
              <span className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {partnerName || "Partner"} picked this
              </span>
            )}
          </button>
        </div>
      </div>
    </GameLayout>
  );
}

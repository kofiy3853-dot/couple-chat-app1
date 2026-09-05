"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Star, RotateCcw, Heart, Share2, Users } from "lucide-react";

interface RateCategory {
  name: string;
  description: string;
  icon: string;
}

const categories: RateCategory[] = [
  { name: "Communication", description: "How well do you talk things out?", icon: "💬" },
  { name: "Trust", description: "How strong is your trust?", icon: "🤝" },
  { name: "Romance", description: "How romantic are you together?", icon: "❤️" },
  { name: "Humor", description: "How much do you make each other laugh?", icon: "😂" },
  { name: "Support", description: "How much do you support each other?", icon: "💪" },
  { name: "Adventure", description: "How adventurous are you together?", icon: "🗺️" },
  { name: "Intimacy", description: "How deep is your emotional connection?", icon: "💕" },
  { name: "Patience", description: "How patient are you with each other?", icon: "🕊️" },
  { name: "Fun", description: "How much fun do you have together?", icon: "🎉" },
  { name: "Growth", description: "How much do you grow together?", icon: "🌱" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="transition-all hover:scale-110"
        >
          <Star
            className={cn(
              "h-10 w-10",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

interface GameSocketActions {
  startGame: (conversationId: string, game: string, payload?: unknown) => void;
  makeChoice: (conversationId: string, game: string, payload: unknown) => void;
  sendQuestion: (conversationId: string, game: string, question: string, payload?: unknown) => void;
  sendAnswer: (conversationId: string, game: string, completed: boolean, payload?: unknown) => void;
  endGame: (conversationId: string, game: string) => void;
}

interface RateEachOtherProps {
  onBack: () => void;
  conversationId: string | null;
  userId: string;
  connected: boolean;
  socketActions: GameSocketActions;
  onRegisterHandlers: (key: string, fn: (...args: unknown[]) => void) => void;
}

export function RateEachOther({ onBack, conversationId, userId, connected, socketActions, onRegisterHandlers }: RateEachOtherProps) {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [ratings, setRatings] = useState<number[]>(new Array(categories.length).fill(0));
  const [gameOver, setGameOver] = useState(false);
  const [partnerRatings, setPartnerRatings] = useState<Record<number, number>>({});
  const [partnerName, setPartnerName] = useState("");

  useEffect(() => {
    onRegisterHandlers("onGameChoiceMade", (data: unknown) => {
      const d = data as { fromUserId: string; fromUserName: string; game: string; payload?: { categoryIndex: number; rating: number } };
      if (d.fromUserId === userId || d.game !== "rate-each-other" || !d.payload) return;
      setPartnerName(d.fromUserName);
      setPartnerRatings((prev) => ({ ...prev, [d.payload!.categoryIndex]: d.payload!.rating }));
    });

    onRegisterHandlers("onGameEnded", (data: unknown) => {
      const d = data as { fromUserId: string; game: string };
      if (d.fromUserId === userId || d.game !== "rate-each-other") return;
    });
  }, [userId, onRegisterHandlers]);

  const category = categories[currentCategory];
  const progress = ((currentCategory + 1) / categories.length) * 100;

  const handleRate = (value: number) => {
    const newRatings = [...ratings];
    newRatings[currentCategory] = value;
    setRatings(newRatings);
    if (conversationId) {
      socketActions.makeChoice(conversationId, "rate-each-other", { categoryIndex: currentCategory, rating: value });
    }
  };

  const handleNext = () => {
    if (currentCategory + 1 >= categories.length) {
      setGameOver(true);
      if (conversationId) socketActions.endGame(conversationId, "rate-each-other");
    } else {
      setCurrentCategory((c) => c + 1);
    }
  };

  const handleBack = () => {
    if (currentCategory > 0) setCurrentCategory((c) => c - 1);
  };

  const handleRestart = () => {
    setCurrentCategory(0);
    setRatings(new Array(categories.length).fill(0));
    setGameOver(false);
    setPartnerRatings({});
  };

  const total = ratings.reduce((a, b) => a + b, 0);
  const avg = (total / categories.length).toFixed(1);
  const partnerTotal = Object.values(partnerRatings).reduce((a, b) => a + b, 0);
  const partnerCount = Object.keys(partnerRatings).length;
  const partnerAvg = partnerCount > 0 ? (partnerTotal / partnerCount).toFixed(1) : "—";
  const shareText = `Our relationship scores:\n${categories.map((c, i) => `${c.icon} ${c.name}: ${ratings[i]}/5`).join("\n")}\nOverall: ${avg}/5 💕`;

  if (!conversationId) {
    return (
      <GameLayout title="Rate Each Other" onBack={onBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No partner connected</h2>
            <p className="text-gray-500 mb-4">You need to be in a couple to play Rate Each Other.</p>
            <Button variant="outline" onClick={onBack}>Back to Games</Button>
          </CardContent>
        </Card>
      </GameLayout>
    );
  }

  if (gameOver) {
    return (
      <GameLayout title="Rate Each Other" onBack={onBack}>
        <div className="space-y-6">
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-6 text-center">
              <Heart className="h-12 w-12 text-rose-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Relationship Score</h2>
              <div className="flex gap-8 justify-center mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">You</p>
                  <p className="text-3xl font-bold text-rose-500">{avg} <span className="text-lg text-gray-400">/ 5.0</span></p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{partnerName || "Partner"}</p>
                  <p className="text-3xl font-bold text-blue-500">{partnerAvg} <span className="text-lg text-gray-400">/ 5.0</span></p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(shareText)}>
                <Share2 className="h-4 w-4 mr-2" /> Share Results
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">Compare ratings</p>
              <div className="grid gap-2">
                {categories.map((cat, i) => {
                  const myR = ratings[i];
                  const partnerR = partnerRatings[i];
                  const diff = partnerR ? Math.abs(myR - partnerR) : null;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-medium text-gray-700 text-sm">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, s) => (
                            <Star key={s} className={cn("h-3 w-3", s < myR ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200")} />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">{myR}</span>
                        </div>
                        {partnerR ? (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, s) => (
                              <Star key={s} className={cn("h-3 w-3", s < partnerR ? "fill-blue-400 text-blue-400" : "fill-gray-200 text-gray-200")} />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">{partnerR}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">waiting...</span>
                        )}
                        {diff !== null && (
                          <span className={cn("text-xs", diff === 0 ? "text-green-600" : "text-orange-500")}>
                            {diff === 0 ? "Same!" : `±${diff}`}
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
    <GameLayout
      title="Rate Each Other"
      subtitle={`${category.icon} ${category.name} · ${connected ? "Connected" : "Connecting..."}`}
      onBack={onBack}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {currentCategory + 1} of {categories.length}
          </span>
          <Badge variant="secondary">
            {ratings.filter((r) => r > 0).length} rated
          </Badge>
        </div>

        <div className="flex gap-1.5 justify-center">
          {categories.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i < currentCategory
                  ? "bg-yellow-500"
                  : i === currentCategory
                    ? "bg-gray-400"
                    : "bg-gray-200"
              )}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <span className="text-5xl mb-4 block">{category.icon}</span>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h2>
            <p className="text-gray-500 mb-6">{category.description}</p>
            <StarRating value={ratings[currentCategory]} onChange={handleRate} />
            <p className="text-sm text-gray-400 mt-4">
              {ratings[currentCategory] === 0
                ? "Tap a star to rate"
                : `${ratings[currentCategory]} out of 5 stars`}
            </p>
            {partnerRatings[currentCategory] && (
              <p className="text-sm text-blue-500 mt-2">
                {partnerName || "Partner"} rated {partnerRatings[currentCategory]} stars
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {currentCategory > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              ← Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={ratings[currentCategory] === 0}
            className="flex-1"
          >
            {currentCategory + 1 >= categories.length ? "See Results" : "Next →"}
          </Button>
        </div>
      </div>
    </GameLayout>
  );
}

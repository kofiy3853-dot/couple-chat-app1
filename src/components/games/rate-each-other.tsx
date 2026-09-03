"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Star, RotateCcw, Trophy, Heart } from "lucide-react";

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

function StarRating({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className={cn(
            "transition-all",
            disabled ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              "h-8 w-8",
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

export function RateEachOther({ onBack }: { onBack: () => void }) {
  const [currentCategory, setCurrentCategory] = useState(0);
  const [player1Ratings, setPlayer1Ratings] = useState<number[]>(new Array(categories.length).fill(0));
  const [player2Ratings, setPlayer2Ratings] = useState<number[]>(new Array(categories.length).fill(0));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  const category = categories[currentCategory];
  const ratings = currentPlayer === 1 ? player1Ratings : player2Ratings;
  const setRatings = currentPlayer === 1 ? setPlayer1Ratings : setPlayer2Ratings;

  const handleRate = (value: number) => {
    const newRatings = [...ratings];
    newRatings[currentCategory] = value;
    setRatings(newRatings);
  };

  const handleNext = () => {
    if (currentPlayer === 1) {
      setCurrentPlayer(2);
    } else {
      setCurrentPlayer(1);
      if (currentCategory + 1 >= categories.length) {
        setGameOver(true);
      } else {
        setCurrentCategory((c) => c + 1);
      }
    }
  };

  const handleRestart = () => {
    setCurrentCategory(0);
    setPlayer1Ratings(new Array(categories.length).fill(0));
    setPlayer2Ratings(new Array(categories.length).fill(0));
    setCurrentPlayer(1);
    setGameOver(false);
  };

  if (gameOver) {
    const p1Total = player1Ratings.reduce((a, b) => a + b, 0);
    const p2Total = player2Ratings.reduce((a, b) => a + b, 0);
    const avgTotal = ((p1Total + p2Total) / 2 / categories.length).toFixed(1);

    return (
      <GameLayout title="Rate Each Other" onBack={onBack}>
        <div className="space-y-6">
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-6 text-center">
              <Heart className="h-12 w-12 text-rose-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Your Relationship Score
              </h2>
              <p className="text-4xl font-bold text-rose-500 mb-2">
                {avgTotal} <span className="text-lg text-gray-400">/ 5.0</span>
              </p>
              <p className="text-gray-500">
                {Number(avgTotal) >= 4 ? "Incredible connection! 💕" : Number(avgTotal) >= 3 ? "Strong relationship! 🌟" : "Keep building together! 💪"}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-gray-700 text-sm">{cat.name}</span>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="text-blue-600">
                    P1: {player1Ratings[i]}/5
                  </Badge>
                  <Badge variant="outline" className="text-rose-600">
                    P2: {player2Ratings[i]}/5
                  </Badge>
                </div>
              </div>
            ))}
          </div>

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
      subtitle={`${category.icon} ${category.name} — Player ${currentPlayer}'s turn`}
      onBack={onBack}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <span className="text-5xl mb-4 block">{category.icon}</span>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h2>
            <p className="text-gray-500 mb-6">{category.description}</p>
            <div className="flex justify-center mb-4">
              <StarRating value={ratings[currentCategory]} onChange={handleRate} />
            </div>
            <p className="text-sm text-gray-400">
              {ratings[currentCategory] === 0
                ? "Tap a star to rate"
                : `${ratings[currentCategory]} out of 5 stars`}
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={handleNext}
          disabled={ratings[currentCategory] === 0}
          className="w-full"
        >
          {currentPlayer === 1 ? "Pass to Player 2 →" : currentCategory + 1 >= categories.length ? "See Results" : "Next Category →"}
        </Button>
      </div>
    </GameLayout>
  );
}

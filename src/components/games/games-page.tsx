"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, HelpCircle, GitBranch, Star, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TruthOrDare } from "./truth-or-dare";
import { CouplesQuiz } from "./couples-quiz";
import { WouldYouRather } from "./would-you-rather";
import { RateEachOther } from "./rate-each-other";
import { TwoTruthsLie } from "./two-truths-lie";

type GameId = "truth-or-dare" | "couples-quiz" | "would-you-rather" | "rate-each-other" | "two-truths-lie" | null;

const games = [
  {
    id: "truth-or-dare" as const,
    name: "Truth or Dare",
    description: "Answer truthfully or take on a fun dare!",
    icon: Flame,
    color: "from-red-500 to-orange-500",
    bgLight: "bg-red-50",
    textColor: "text-red-600",
  },
  {
    id: "couples-quiz" as const,
    name: "Couples Quiz",
    description: "Test how well you know each other.",
    icon: HelpCircle,
    color: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    id: "would-you-rather" as const,
    name: "Would You Rather",
    description: "Pick between two fun scenarios.",
    icon: GitBranch,
    color: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    id: "rate-each-other" as const,
    name: "Rate Each Other",
    description: "Rate different aspects of your relationship.",
    icon: Star,
    color: "from-yellow-500 to-amber-500",
    bgLight: "bg-yellow-50",
    textColor: "text-yellow-600",
  },
  {
    id: "two-truths-lie" as const,
    name: "Two Truths & a Lie",
    description: "Guess which statement is the lie!",
    icon: Brain,
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
];

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId>(null);
  const router = useRouter();

  if (activeGame) {
    const game = games.find((g) => g.id === activeGame);
    if (!game) return null;

    const handleBack = () => setActiveGame(null);

    switch (activeGame) {
      case "truth-or-dare":
        return <TruthOrDare onBack={handleBack} />;
      case "couples-quiz":
        return <CouplesQuiz onBack={handleBack} />;
      case "would-you-rather":
        return <WouldYouRather onBack={handleBack} />;
      case "rate-each-other":
        return <RateEachOther onBack={handleBack} />;
      case "two-truths-lie":
        return <TwoTruthsLie onBack={handleBack} />;
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900">Couple Games</h1>
        </div>
        <p className="text-gray-500">
          Play fun games together and learn more about each other!
        </p>
      </div>

      <div className="grid gap-4">
        {games.map((game) => (
          <Card
            key={game.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
              "border-gray-200"
            )}
            onClick={() => setActiveGame(game.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("p-3 rounded-xl", game.bgLight)}>
                <game.icon className={cn("h-6 w-6", game.textColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{game.name}</h3>
                <p className="text-sm text-gray-500">{game.description}</p>
              </div>
              <div className="text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

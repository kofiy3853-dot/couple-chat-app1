"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Brain, RotateCcw, Trophy, CheckCircle, XCircle, Share2 } from "lucide-react";

interface TruthLieStatement {
  statements: [string, string, string];
  lieIndex: number;
}

const statements: TruthLieStatement[] = [
  { statements: ["I've never broken a bone", "I once ate an entire pizza alone", "I'm afraid of heights"], lieIndex: 2 },
  { statements: ["I can play a musical instrument", "I've been skydiving", "I speak more than two languages"], lieIndex: 1 },
  { statements: ["I once won a singing competition", "I've never been camping", "I can solve a Rubik's cube fast"], lieIndex: 0 },
  { statements: ["I've traveled to more than 10 countries", "I once met a celebrity at a cafe", "I have a fear of flying"], lieIndex: 1 },
  { statements: ["I can cook a three-course meal", "I've never broken a rule", "I once stayed awake for 48 hours"], lieIndex: 1 },
  { statements: ["I've written a poem for someone", "I can touch my nose with my tongue", "I've never been stung by a bee"], lieIndex: 1 },
  { statements: ["I once got lost in a foreign city", "I have a photographic memory", "I've never failed a test"], lieIndex: 1 },
  { statements: ["I can do a backflip", "I've never watched a horror movie", "I once ran a marathon"], lieIndex: 0 },
  { statements: ["I speak fluent Spanish", "I've never been on a plane", "I have a twin sibling"], lieIndex: 1 },
  { statements: ["I can solve a Rubik's cube in under a minute", "I've never broken a phone screen", "I once met my hero"], lieIndex: 0 },
];

export function TwoTruthsLie({ onBack }: { onBack: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [answers, setAnswers] = useState<{ statements: string[]; guess: number; lieIndex: number; isCorrect: boolean }[]>([]);
  const [shuffledStatements] = useState(() =>
    [...statements].sort(() => Math.random() - 0.5).slice(0, 8)
  );

  const statement = shuffledStatements[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledStatements.length) * 100;

  const handleGuess = useCallback((index: number) => {
    if (guess !== null) return;
    setGuess(index);
    setShowResult(true);
    const isCorrect = index === statement.lieIndex;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((a) => [...a, {
      statements: [...statement.statements],
      guess: index,
      lieIndex: statement.lieIndex,
      isCorrect,
    }]);
  }, [guess, statement]);

  const handleNext = () => {
    if (currentQuestion + 1 >= shuffledStatements.length) {
      setGameOver(true);
    } else {
      setCurrentQuestion((q) => q + 1);
      setGuess(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setGuess(null);
    setShowResult(false);
    setGameOver(false);
    setAnswers([]);
  };

  const shareText = `I scored ${score}/${shuffledStatements.length} on Two Truths & a Lie! Think you can beat me? 🧠`;

  if (gameOver) {
    const percentage = Math.round((score / shuffledStatements.length) * 100);
    return (
      <GameLayout title="Two Truths & a Lie" onBack={onBack}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className={cn("h-16 w-16 mx-auto mb-4", percentage >= 70 ? "text-yellow-500" : "text-gray-400")} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {percentage >= 70 ? "Sharp lie detector! 🕵️" : percentage >= 50 ? "Not bad! 🤔" : "Keep trying! 💪"}
              </h2>
              <p className="text-gray-500 mb-4">
                You got {score} out of {shuffledStatements.length} correct ({percentage}%)
              </p>
              <Progress value={percentage} className="h-3 mb-4" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard?.writeText(shareText)}
              >
                <Share2 className="h-4 w-4 mr-2" /> Share Score
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">Review</p>
              <div className="space-y-4">
                {answers.map((a, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {a.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Round {i + 1}</span>
                    </div>
                    <div className="space-y-1 ml-6">
                      {a.statements.map((s, j) => (
                        <p key={j} className={cn(
                          "text-sm",
                          j === a.lieIndex ? "text-green-600 font-medium" : "text-gray-500",
                          j === a.guess && j !== a.lieIndex ? "text-red-500 line-through" : ""
                        )}>
                          {s} {j === a.lieIndex ? "(Lie)" : j === a.guess ? "(Your guess)" : ""}
                        </p>
                      ))}
                    </div>
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
    <GameLayout title="Two Truths & a Lie" subtitle="Which one is the lie?" onBack={onBack}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Round {currentQuestion + 1} of {shuffledStatements.length}
          </span>
          <Badge variant="secondary">Score: {score}</Badge>
        </div>
        <Progress value={progress} className="h-2" />

        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-gray-500">Two are true, one is a lie. Find the lie!</p>
            </div>
            <div className="grid gap-3">
              {statement.statements.map((text, index) => {
                const isLie = index === statement.lieIndex;
                const isGuessed = index === guess;
                return (
                  <button
                    key={index}
                    onClick={() => handleGuess(index)}
                    disabled={guess !== null}
                    className={cn(
                      "p-4 text-left rounded-lg border-2 transition-all",
                      guess === null
                        ? "border-gray-200 hover:border-purple-300 hover:bg-purple-50 active:scale-[0.98]"
                        : isLie
                          ? "border-green-500 bg-green-50"
                          : isGuessed
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 flex-1">{text}</span>
                      {showResult && isLie && (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      )}
                      {showResult && isGuessed && !isLie && (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {showResult && (
          <Button onClick={handleNext} className="w-full">
            {currentQuestion + 1 >= shuffledStatements.length ? "See Results" : "Next Round →"}
          </Button>
        )}
      </div>
    </GameLayout>
  );
}

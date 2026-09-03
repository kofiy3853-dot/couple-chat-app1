"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Brain, RotateCcw, Trophy, CheckCircle, XCircle } from "lucide-react";

interface TruthLieStatement {
  statements: [string, string, string]; // [truth1, truth2, lie]
  lieIndex: number;
}

const statements: TruthLieStatement[] = [
  {
    statements: [
      "I've never broken a bone in my body",
      "I once ate an entire pizza by myself in one sitting",
      "I'm afraid of heights",
    ],
    lieIndex: 2,
  },
  {
    statements: [
      "I can play a musical instrument",
      "I've been skydiving before",
      "I speak more than two languages",
    ],
    lieIndex: 1,
  },
  {
    statements: [
      "I once won a singing competition",
      "I've never been camping",
      "I can solve a Rubik's cube in under a minute",
    ],
    lieIndex: 0,
  },
  {
    statements: [
      "I've traveled to more than 10 countries",
      "I once met a celebrity at a coffee shop",
      "I have a fear of flying",
    ],
    lieIndex: 1,
  },
  {
    statements: [
      "I can cook a three-course meal from scratch",
      "I've never broken a rule",
      "I once stayed awake for 48 hours straight",
    ],
    lieIndex: 1,
  },
  {
    statements: [
      "I've written a poem for someone before",
      "I can touch my nose with my tongue",
      "I've never been stung by a bee",
    ],
    lieIndex: 1,
  },
  {
    statements: [
      "I once got lost in a foreign city",
      "I have a photographic memory",
      "I've never failed a test",
    ],
    lieIndex: 1,
  },
  {
    statements: [
      "I can do a backflip",
      "I've never watched a horror movie",
      "I once ran a marathon",
    ],
    lieIndex: 0,
  },
];

export function TwoTruthsLie({ onBack }: { onBack: () => void }) {
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [currentStatement, setCurrentStatement] = useState(0);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledStatements] = useState(() =>
    [...statements].sort(() => Math.random() - 0.5).slice(0, 6)
  );

  const statement = shuffledStatements[currentStatement];

  const handleGuess = useCallback((index: number) => {
    if (guess !== null) return;
    setGuess(index);
    setShowResult(true);
    const isCorrect = index === statement.lieIndex;
    if (currentPlayer === 1) {
      if (isCorrect) setPlayer1Score((s) => s + 1);
    } else {
      if (isCorrect) setPlayer2Score((s) => s + 1);
    }
  }, [guess, statement, currentPlayer]);

  const handleNext = () => {
    if (currentPlayer === 1) {
      setCurrentPlayer(2);
    } else {
      setCurrentPlayer(1);
      if (currentStatement + 1 >= shuffledStatements.length) {
        setGameOver(true);
      } else {
        setCurrentStatement((s) => s + 1);
      }
    }
    setGuess(null);
    setShowResult(false);
  };

  const handleRestart = () => {
    setCurrentPlayer(1);
    setCurrentStatement(0);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setGuess(null);
    setShowResult(false);
    setGameOver(false);
  };

  if (gameOver) {
    const totalPerPlayer = shuffledStatements.length;
    return (
      <GameLayout title="Two Truths & a Lie" onBack={onBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Final Scores</h2>
            <div className="flex gap-6 justify-center mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Player 1</p>
                <p className="text-3xl font-bold text-blue-500">{player1Score}/{totalPerPlayer}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Player 2</p>
                <p className="text-3xl font-bold text-rose-500">{player2Score}/{totalPerPlayer}</p>
              </div>
            </div>
            <p className="text-gray-500 mb-6">
              {player1Score > player2Score
                ? "Player 1 wins! Better lie detector! 🕵️"
                : player2Score > player1Score
                  ? "Player 2 wins! Better lie detector! 🕵️"
                  : "It's a tie! You're both great lie detectors! 🤝"}
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
    <GameLayout
      title="Two Truths & a Lie"
      subtitle={`Player ${currentPlayer}'s turn — Find the lie!`}
      onBack={onBack}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Round {currentStatement + 1} of {shuffledStatements.length}
          </span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-blue-600">P1: {player1Score}</Badge>
            <Badge variant="outline" className="text-rose-600">P2: {player2Score}</Badge>
          </div>
        </div>

        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-gray-500">Two of these are true, one is a lie. Which one is it?</p>
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
            {currentPlayer === 2 && currentStatement + 1 >= shuffledStatements.length
              ? "See Results"
              : currentPlayer === 1
                ? "Pass to Player 2 →"
                : "Next Round →"}
          </Button>
        )}
      </div>
    </GameLayout>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Brain, RotateCcw, Trophy, CheckCircle, XCircle, Share2, Users } from "lucide-react";

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

interface GameSocketActions {
  startGame: (conversationId: string, game: string, payload?: unknown) => void;
  makeChoice: (conversationId: string, game: string, payload: unknown) => void;
  sendQuestion: (conversationId: string, game: string, question: string, payload?: unknown) => void;
  sendAnswer: (conversationId: string, game: string, completed: boolean, payload?: unknown) => void;
  endGame: (conversationId: string, game: string) => void;
}

interface TwoTruthsLieProps {
  onBack: () => void;
  conversationId: string | null;
  userId: string;
  connected: boolean;
  socketActions: GameSocketActions;
  onRegisterHandlers: (key: string, fn: (...args: unknown[]) => void) => void;
}

export function TwoTruthsLie({ onBack, conversationId, userId, connected, socketActions, onRegisterHandlers }: TwoTruthsLieProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [answers, setAnswers] = useState<{ statements: string[]; guess: number; lieIndex: number; isCorrect: boolean }[]>([]);
  const [partnerGuesses, setPartnerGuesses] = useState<Record<number, number>>({});
  const [partnerName, setPartnerName] = useState("");
  const [partnerScore, setPartnerScore] = useState(0);
  const [shuffledStatements] = useState(() =>
    [...statements].sort(() => Math.random() - 0.5).slice(0, 8)
  );

  useEffect(() => {
    onRegisterHandlers("onGameChoiceMade", (data: unknown) => {
      const d = data as { fromUserId: string; fromUserName: string; game: string; payload?: { questionIndex: number; guessIndex: number } };
      if (d.fromUserId === userId || d.game !== "two-truths-lie" || !d.payload) return;
      setPartnerName(d.fromUserName);
      setPartnerGuesses((prev) => ({ ...prev, [d.payload!.questionIndex]: d.payload!.guessIndex }));
      const s = shuffledStatements[d.payload!.questionIndex];
      if (s && d.payload!.guessIndex === s.lieIndex) {
        setPartnerScore((p) => p + 1);
      }
    });

    onRegisterHandlers("onGameEnded", (data: unknown) => {
      const d = data as { fromUserId: string; game: string };
      if (d.fromUserId === userId || d.game !== "two-truths-lie") return;
    });
  }, [userId, onRegisterHandlers, shuffledStatements]);

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
    if (conversationId) {
      socketActions.makeChoice(conversationId, "two-truths-lie", { questionIndex: currentQuestion, guessIndex: index });
    }
  }, [guess, statement, conversationId, socketActions, currentQuestion]);

  const handleNext = () => {
    if (currentQuestion + 1 >= shuffledStatements.length) {
      setGameOver(true);
      if (conversationId) socketActions.endGame(conversationId, "two-truths-lie");
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
    setPartnerGuesses({});
    setPartnerScore(0);
  };

  const shareText = `I scored ${score}/${shuffledStatements.length} on Two Truths & a Lie! Think you can beat me? 🧠`;

  if (!conversationId) {
    return (
      <GameLayout title="Two Truths & a Lie" onBack={onBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No partner connected</h2>
            <p className="text-gray-500 mb-4">You need to be in a couple to play Two Truths & a Lie.</p>
            <Button variant="outline" onClick={onBack}>Back to Games</Button>
          </CardContent>
        </Card>
      </GameLayout>
    );
  }

  if (gameOver) {
    const percentage = Math.round((score / shuffledStatements.length) * 100);
    const partnerPercentage = Math.round((partnerScore / shuffledStatements.length) * 100);
    return (
      <GameLayout title="Two Truths & a Lie" onBack={onBack}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className={cn("h-16 w-16 mx-auto mb-4", percentage >= 70 ? "text-yellow-500" : "text-gray-400")} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {score > partnerScore ? "You won! 🕵️" : partnerScore > score ? `${partnerName || "Partner"} wins! 🕵️` : "It's a tie! 🤝"}
              </h2>
              <div className="flex gap-8 justify-center mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">You</p>
                  <p className="text-3xl font-bold text-green-500">{score}/{shuffledStatements.length}</p>
                  <Progress value={percentage} className="h-2 w-24 mx-auto mt-1" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{partnerName || "Partner"}</p>
                  <p className="text-3xl font-bold text-blue-500">{partnerScore}/{shuffledStatements.length}</p>
                  <Progress value={partnerPercentage} className="h-2 w-24 mx-auto mt-1" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(shareText)}>
                <Share2 className="h-4 w-4 mr-2" /> Share Score
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">Compare guesses</p>
              <div className="space-y-4">
                {shuffledStatements.map((s, i) => {
                  const myA = answers[i];
                  const partnerG = partnerGuesses[i];
                  const hasPartner = partnerG !== undefined;
                  return (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {myA ? (
                          myA.isCorrect ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium text-gray-700">Round {i + 1}</span>
                      </div>
                      <div className="space-y-1 ml-6">
                        {s.statements.map((st, j) => (
                          <p key={j} className={cn(
                            "text-sm",
                            j === s.lieIndex ? "text-green-600 font-medium" : "text-gray-500",
                            j === myA?.guess && j !== s.lieIndex ? "text-red-500 line-through" : ""
                          )}>
                            {st} {j === s.lieIndex ? "(Lie)" : ""}
                          </p>
                        ))}
                      </div>
                      {hasPartner && (
                        <p className="text-xs text-blue-500 ml-6 mt-1">
                          {partnerName || "Partner"} guessed: {partnerG + 1} {partnerG === s.lieIndex ? "✓" : "✗"}
                        </p>
                      )}
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
    <GameLayout title="Two Truths & a Lie" subtitle={`Which one is the lie? · ${connected ? "Connected" : "Connecting..."}`} onBack={onBack}>
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
                const partnerGuessedThis = partnerGuesses[currentQuestion] === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleGuess(index)}
                    disabled={guess !== null}
                    className={cn(
                      "p-4 text-left rounded-lg border-2 transition-all relative",
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
                    {partnerGuessedThis && (
                      <span className="absolute top-1 right-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                        {partnerName || "Partner"} picked
                      </span>
                    )}
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

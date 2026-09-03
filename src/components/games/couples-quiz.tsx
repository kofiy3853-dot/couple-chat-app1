"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "Where did you have your first date?",
    options: ["Restaurant", "Coffee shop", "Park", "Movie theater"],
    correctIndex: 0,
  },
  {
    question: "What's your partner's favorite food?",
    options: ["Pizza", "Sushi", "Pasta", "Tacos"],
    correctIndex: 1,
  },
  {
    question: "What color are your partner's eyes?",
    options: ["Brown", "Blue", "Green", "Hazel"],
    correctIndex: 0,
  },
  {
    question: "What's your partner's biggest pet peeve?",
    options: ["Loud chewing", "Being late", "Messy room", "Bad grammar"],
    correctIndex: 1,
  },
  {
    question: "What's your partner's dream vacation destination?",
    options: ["Paris", "Maldives", "Tokyo", "Bali"],
    correctIndex: 2,
  },
  {
    question: "What's your partner's favorite movie?",
    options: ["The Notebook", "Titanic", "Friends", "Interstellar"],
    correctIndex: 3,
  },
  {
    question: "What's your partner's love language?",
    options: ["Words of affirmation", "Quality time", "Physical touch", "Acts of service"],
    correctIndex: 0,
  },
  {
    question: "What's your partner's biggest fear?",
    options: ["Heights", "Spiders", "Loneliness", "Flying"],
    correctIndex: 2,
  },
  {
    question: "What's your partner's favorite season?",
    options: ["Spring", "Summer", "Fall", "Winter"],
    correctIndex: 1,
  },
  {
    question: "What's your partner's go-to comfort food?",
    options: ["Ice cream", "Chocolate", "Mac and cheese", "Pizza"],
    correctIndex: 0,
  },
];

export function CouplesQuiz({ onBack }: { onBack: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shuffledQuestions] = useState(() =>
    [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 8)
  );

  const question = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === question.correctIndex) {
      setScore((s) => s + 1);
    }
  }, [selectedAnswer, question]);

  const handleNext = () => {
    if (currentQuestion + 1 >= shuffledQuestions.length) {
      setGameOver(true);
    } else {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
  };

  if (gameOver) {
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    return (
      <GameLayout title="Couples Quiz" onBack={onBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className={cn("h-16 w-16 mx-auto mb-4", percentage >= 70 ? "text-yellow-500" : "text-gray-400")} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {percentage >= 70 ? "Amazing! 🎉" : percentage >= 50 ? "Not bad! 👍" : "Keep learning! 💪"}
            </h2>
            <p className="text-gray-500 mb-4">
              You got {score} out of {shuffledQuestions.length} correct ({percentage}%)
            </p>
            <Progress value={percentage} className="h-3 mb-6" />
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
    <GameLayout title="Couples Quiz" subtitle="How well do you know each other?" onBack={onBack}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {shuffledQuestions.length}
          </span>
          <Badge variant="secondary">Score: {score}</Badge>
        </div>
        <Progress value={progress} className="h-2" />

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{question.question}</h2>
            <div className="grid gap-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    "p-4 text-left rounded-lg border-2 transition-all",
                    selectedAnswer === null
                      ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      : index === question.correctIndex
                        ? "border-green-500 bg-green-50"
                        : index === selectedAnswer
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-700">{option}</span>
                    {showResult && index === question.correctIndex && (
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    )}
                    {showResult && index === selectedAnswer && index !== question.correctIndex && (
                      <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {showResult && (
          <Button onClick={handleNext} className="w-full">
            {currentQuestion + 1 >= shuffledQuestions.length ? "See Results" : "Next Question →"}
          </Button>
        )}
      </div>
    </GameLayout>
  );
}

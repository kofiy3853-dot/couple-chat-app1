"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GameLayout } from "./game-layout";
import { Flame, Heart, Sparkles, RotateCcw, Loader2, Users } from "lucide-react";

const truths = [
  "What's your favorite memory of us?",
  "What's something I do that makes you smile?",
  "When did you first know you loved me?",
  "What's a secret talent you have that I don't know about?",
  "What's your biggest fear about our relationship?",
  "What's the most romantic thing I've ever done?",
  "If you could change one thing about our first date, what would it be?",
  "What's something you've always wanted to tell me but haven't?",
  "What's your favorite physical feature of mine?",
  "What song reminds you of us?",
  "What's the kindest thing I've ever done for you?",
  "What's a dream you have for our future together?",
  "What's something that made you jealous?",
  "What's your favorite thing we do together?",
  "When do you feel most loved by me?",
  "What's a small thing I do that means a lot to you?",
  "What's something you admire about me?",
  "What's the funniest memory we share?",
  "What's a goal you want us to achieve together?",
  "What's something you're grateful for in our relationship?",
];

const dares = [
  "Give your partner a 30-second hug",
  "Kiss your partner on the forehead",
  "Tell your partner 3 things you love about them",
  "Do your best impression of your partner",
  "Sing a love song to your partner",
  "Give your partner a compliment sandwich (3 compliments in a row)",
  "Dance with your partner for 1 minute",
  "Hold hands and stare into each other's eyes for 30 seconds",
  "Write a short love poem for your partner",
  "Give your partner a shoulder massage for 1 minute",
  "Share your favorite photo of you two and explain why",
  "Say 'I love you' in 3 different languages",
  "Tell your partner what you'd do differently if you met them again",
  "Imitate how your partner acts when they're sleepy",
  "Create a new handshake with your partner",
  "Whisper something sweet in your partner's ear",
  "Act out your first date together in 30 seconds",
  "Give your partner a piggyback ride (or offer one)",
  "Make up a new couple nickname right now",
  "Do a silly dance and make your partner laugh",
];

type GamePhase =
  | "idle"
  | "waiting-partner-choice"
  | "partner-sent-choice"
  | "pick-question"
  | "waiting-partner-answer"
  | "received-question"
  | "round-result"
  | "game-over";

interface SocketActions {
  startGame: (conversationId: string, game: string, payload?: unknown) => void;
  makeChoice: (conversationId: string, game: string, payload: unknown) => void;
  sendQuestion: (conversationId: string, game: string, question: string, payload?: unknown) => void;
  sendAnswer: (conversationId: string, game: string, completed: boolean, payload?: unknown) => void;
  endGame: (conversationId: string, game: string) => void;
}

interface TruthOrDareProps {
  onBack: () => void;
  conversationId: string | null;
  userId: string;
  connected: boolean;
  socketActions: SocketActions;
  onRegisterHandlers: (key: string, fn: (...args: unknown[]) => void) => void;
}

export function TruthOrDare({ onBack, conversationId, userId, connected, socketActions, onRegisterHandlers }: TruthOrDareProps) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [round, setRound] = useState(1);
  const [challengeType, setChallengeType] = useState<"truth" | "dare" | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [lastResult, setLastResult] = useState<{ completed: boolean; by: string } | null>(null);

  useEffect(() => {
    onRegisterHandlers("onGameChallengeReceived", (data: unknown) => {
      const d = data as { fromUserId: string; fromUserName: string; game: string; type?: { type: "truth" | "dare" } };
      if (d.fromUserId === userId || d.game !== "truth-or-dare") return;
      setPartnerName(d.fromUserName);
      setChallengeType(d.type?.type ?? null);
      setPhase("partner-sent-choice");
    });

    onRegisterHandlers("onGameChoiceMade", (data: unknown) => {
      const d = data as { fromUserId: string; fromUserName: string; game: string; payload?: { type: "truth" | "dare" } };
      if (d.fromUserId === userId || d.game !== "truth-or-dare") return;
      setChallengeType(d.payload?.type ?? null);
      setPhase("pick-question");
    });

    onRegisterHandlers("onGameQuestionReceived", (data: unknown) => {
      const d = data as { fromUserId: string; fromUserName: string; game: string; question: string; type?: { type: "truth" | "dare" } };
      if (d.fromUserId === userId || d.game !== "truth-or-dare") return;
      setSelectedQuestion(d.question);
      setChallengeType(d.type?.type ?? null);
      setPartnerName(d.fromUserName);
      setPhase("received-question");
    });

    onRegisterHandlers("onGameAnswerResult", (data: unknown) => {
      const d = data as { fromUserId: string; fromUserName: string; game: string; completed: boolean };
      if (d.fromUserId === userId || d.game !== "truth-or-dare") return;
      setLastResult({ completed: d.completed, by: d.fromUserName });
      if (d.completed) setPartnerScore((s) => s + 1);
      setPhase("round-result");
    });

    onRegisterHandlers("onGameEnded", (data: unknown) => {
      const d = data as { fromUserId: string; game: string };
      if (d.fromUserId === userId || d.game !== "truth-or-dare") return;
      setPhase("game-over");
    });
  }, [userId, onRegisterHandlers]);

  if (!conversationId) {
    return (
      <GameLayout title="Truth or Dare" onBack={onBack}>
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No partner connected</h2>
            <p className="text-gray-500 mb-4">You need to be in a couple to play Truth or Dare.</p>
            <Button variant="outline" onClick={onBack}>Back to Games</Button>
          </CardContent>
        </Card>
      </GameLayout>
    );
  }

  const pool = challengeType === "truth" ? truths : dares;

  const handleSendChallenge = (type: "truth" | "dare") => {
    setChallengeType(type);
    socketActions.startGame(conversationId, "truth-or-dare", { type });
    setPhase("waiting-partner-choice");
  };

  const handlePartnerChoice = (type: "truth" | "dare") => {
    socketActions.makeChoice(conversationId, "truth-or-dare", { type });
    setChallengeType(type);
    setPhase("pick-question");
  };

  const handleSelectQuestion = (question: string) => {
    setSelectedQuestion(question);
    socketActions.sendQuestion(conversationId, "truth-or-dare", question, { type: challengeType });
    setPhase("waiting-partner-answer");
  };

  const handleAnswer = (completed: boolean) => {
    socketActions.sendAnswer(conversationId, "truth-or-dare", completed);
    if (completed) setMyScore((s) => s + 1);
    setLastResult({ completed, by: "You" });
    setPhase("round-result");
  };

  const handleNextRound = () => {
    setPhase("idle");
    setChallengeType(null);
    setSelectedQuestion(null);
    setLastResult(null);
    setRound((r) => r + 1);
  };

  const handleEndGame = () => {
    socketActions.endGame(conversationId, "truth-or-dare");
    setPhase("game-over");
  };

  return (
    <GameLayout
      title="Truth or Dare"
      subtitle={`Round ${round} · ${connected ? "Connected" : "Connecting..."}`}
      onBack={onBack}
    >
      <div className="space-y-6">
        {/* Score */}
        <div className="flex gap-3">
          <Card className="flex-1">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">You</p>
              <Badge variant="secondary" className="bg-green-50 text-green-600">
                <Heart className="h-3 w-3 mr-1" />{myScore}
              </Badge>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{partnerName || "Partner"}</p>
              <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                <Heart className="h-3 w-3 mr-1" />{partnerScore}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {!connected && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
              <p className="text-sm text-yellow-700">Connecting to game server...</p>
            </CardContent>
          </Card>
        )}

        {/* Phase: Idle - Send challenge */}
        {phase === "idle" && connected && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-6">Send a challenge to your partner!</p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 px-8 text-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleSendChallenge("truth")}
                >
                  <Flame className="h-5 w-5 mr-2" /> Truth
                </Button>
                <Button
                  size="lg"
                  className="h-20 px-8 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => handleSendChallenge("dare")}
                >
                  <Sparkles className="h-5 w-5 mr-2" /> Dare
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Waiting for partner to choose */}
        {phase === "waiting-partner-choice" && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="font-medium text-gray-900">Waiting for your partner...</p>
              <p className="text-sm text-gray-500 mt-1">You sent a {challengeType} challenge</p>
            </CardContent>
          </Card>
        )}

        {/* Phase: Partner sent choice - you pick truth or dare for them */}
        {phase === "partner-sent-choice" && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">{partnerName} wants to play!</p>
              <p className="font-medium text-gray-900 mb-4">They chose {challengeType === "truth" ? "Truth" : "Dare"}</p>
              <p className="text-sm text-gray-500 mb-4">Now pick what they should do:</p>
              <Button onClick={() => handlePartnerChoice(challengeType!)} className="w-full">
                Pick a {challengeType} for them →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Phase: Pick question for partner */}
        {phase === "pick-question" && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">
                Pick a {challengeType} for {partnerName}:
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pool.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectQuestion(question)}
                    className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Waiting for partner to answer */}
        {phase === "waiting-partner-answer" && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto mb-3" />
              <Badge className={cn("mb-3", challengeType === "truth" ? "bg-blue-500" : "bg-orange-500")}>
                {challengeType === "truth" ? "TRUTH" : "DARE"}
              </Badge>
              <p className="font-medium text-gray-900 mb-1">{selectedQuestion}</p>
              <p className="text-sm text-gray-500">Waiting for {partnerName} to respond...</p>
            </CardContent>
          </Card>
        )}

        {/* Phase: Received question from partner */}
        {phase === "received-question" && (
          <Card className={cn(
            "border-2",
            challengeType === "truth" ? "border-blue-500 bg-blue-50/50" : "border-orange-500 bg-orange-50/50"
          )}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">{partnerName} challenges you!</p>
              <Badge className={cn("mb-4", challengeType === "truth" ? "bg-blue-500" : "bg-orange-500")}>
                {challengeType === "truth" ? "TRUTH" : "DARE"}
              </Badge>
              <p className="text-lg font-medium text-gray-900 mb-6">{selectedQuestion}</p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleAnswer(false)}
                >
                  Skip
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleAnswer(true)}
                >
                  <Heart className="h-4 w-4 mr-2" /> Did it!
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Round result */}
        {phase === "round-result" && lastResult && (
          <Card className={cn(
            "border-2",
            lastResult.completed ? "border-green-500 bg-green-50/50" : "border-gray-300"
          )}>
            <CardContent className="p-6 text-center">
              <p className="font-medium text-gray-900 mb-1">
                {lastResult.by === "You" ? "You" : partnerName} {lastResult.completed ? "completed the challenge!" : "skipped the challenge"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {lastResult.completed ? "Nice work! 💕" : "Maybe next time! 😄"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleNextRound} className="flex-1">
                  Next Round →
                </Button>
                <Button variant="outline" onClick={handleEndGame} className="flex-1">
                  End Game
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Game over */}
        {phase === "game-over" && (
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-12 w-12 text-rose-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Over!</h2>
              <div className="flex gap-6 justify-center mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">You</p>
                  <p className="text-3xl font-bold text-green-500">{myScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{partnerName || "Partner"}</p>
                  <p className="text-3xl font-bold text-blue-500">{partnerScore}</p>
                </div>
              </div>
              <p className="text-gray-500 mb-6">
                {myScore > partnerScore
                  ? "You won! 🏆"
                  : partnerScore > myScore
                    ? `${partnerName || "Partner"} wins! 🏆`
                    : "It's a tie! 🤝"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onBack}>Back to Games</Button>
                <Button onClick={() => {
                  setMyScore(0);
                  setPartnerScore(0);
                  setRound(1);
                  setPhase("idle");
                  setChallengeType(null);
                  setSelectedQuestion(null);
                  setLastResult(null);
                }}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GameLayout>
  );
}

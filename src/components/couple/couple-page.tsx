"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Users, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateCoupleDialog } from "./create-couple-dialog";
import { JoinCoupleDialog } from "./join-couple-dialog";

interface Couple {
  id: string;
  members: {
    userId: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
}

export function CouplePage() {
  const router = useRouter();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    async function fetchCouple() {
      try {
        const res = await fetch("/api/couples");
        const data = await res.json();
        setCouple(data.data);
      } catch {
        setCouple(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCouple();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (couple) {
    const partner = couple.members.find((m) => m.userId !== couple.members[0]?.userId)?.user;

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/30">
            <Heart className="h-10 w-10 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              You&apos;re Connected!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              You and {partner?.name || "your partner"} are connected as a couple.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {couple.members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 border-4 border-white dark:border-gray-950 text-lg font-semibold text-rose-600"
                  >
                    {m.user.name?.charAt(0) || "?"}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {couple.members.map((m) => m.user.name || "Unknown").join(" & ")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connected as a couple
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button asChild className="flex-1" size="lg">
            <a href="/chat" className="gap-2">
              Start Chatting
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/dashboard">
              Back to Dashboard
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/30">
          <Users className="h-10 w-10 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Connect with Your Partner
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create a couple or join your partner to start sharing moments together.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => setCreateOpen(true)}
        >
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors mb-2">
              <Heart className="h-6 w-6 text-rose-500" />
            </div>
            <CardTitle className="text-lg">Create a Couple</CardTitle>
            <CardDescription>
              Start fresh and invite your partner to join you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You&apos;ll get an invitation code to share with your partner.
            </p>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => setJoinOpen(true)}
        >
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-900/20 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 transition-colors mb-2">
              <ArrowRight className="h-6 w-6 text-pink-500" />
            </div>
            <CardTitle className="text-lg">Join a Couple</CardTitle>
            <CardDescription>
              Enter an invitation code from your partner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your partner will share a code with you.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-semibold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  One person creates the couple
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click &quot;Create a Couple&quot; to generate an invitation code.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-semibold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Share the code with your partner
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Copy or share the 6-character code with them.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-sm font-semibold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Your partner enters the code
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  They click &quot;Join a Couple&quot; and enter the code to connect.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateCoupleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <JoinCoupleDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
      />
    </div>
  );
}

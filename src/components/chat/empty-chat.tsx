"use client";

import { Heart, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyChatProps {
  className?: string;
}

export function EmptyChat({ className }: EmptyChatProps) {
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchInvitation = useCallback(async () => {
    if (fetched) return;
    setFetched(true);

    setLoading(true);
    try {
      const res = await fetch("/api/invitations");
      const data = await res.json();
      if (data.success && data.data) {
        setInvitationCode(data.data.code);
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  // Trigger initial fetch on first render
  if (!fetched) {
    fetchInvitation();
  }

  async function generateCode() {
    setLoading(true);
    try {
      const res = await fetch("/api/invitations", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setInvitationCode(data.data.code);
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (invitationCode) {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full px-6 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 mb-6">
        <Heart className="h-10 w-10 text-rose-400 dark:text-rose-500" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Connect with your partner
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-8">
        Share an invitation code with your partner to start chatting together.
      </p>

      {invitationCode ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-6 py-4">
            <span className="font-mono text-2xl font-bold tracking-[0.3em] text-gray-900 dark:text-gray-100">
              {invitationCode}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCode}
              className="h-8 w-8 ml-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            This code expires in 24 hours
          </p>
        </div>
      ) : (
        <Button
          onClick={generateCode}
          disabled={loading}
          className="bg-rose-500 hover:bg-rose-600 text-white"
        >
          {loading ? "Generating..." : "Generate Invitation Code"}
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvitationDisplayProps {
  code: string;
  expiresAt: string | null;
}

export function InvitationDisplay({ code, expiresAt }: InvitationDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    function updateTimer() {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my couple on CoupleChat",
          text: `Use this code to connect with me: ${code}`,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="space-y-4">
      {/* Code Display */}
      <div className="rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 p-6 border border-rose-100 dark:border-rose-800/50">
        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Your Invitation Code
          </p>
          <div className="font-mono text-4xl font-bold tracking-[0.3em] text-rose-600 dark:text-rose-400 select-all">
            {code}
          </div>
          {expiresAt && timeLeft && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Expires in {timeLeft}</span>
            </div>
          )}
        </div>
      </div>

      {/* QR-like visual */}
      <div className="flex justify-center">
        <div className="grid grid-cols-6 gap-1.5 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          {code.split("").map((char, i) => (
            <div
              key={i}
              className="flex items-center justify-center w-8 h-8 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-mono font-bold text-sm"
            >
              {char}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="flex-1 gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Code
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleShare}
          className="flex-1 gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 space-y-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          What to do next:
        </p>
        <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
          <li>Copy or share this code with your partner</li>
          <li>Have them open the CoupleChat app</li>
          <li>They should click &quot;Join a Couple&quot;</li>
          <li>Enter this code to connect</li>
        </ol>
      </div>
    </div>
  );
}

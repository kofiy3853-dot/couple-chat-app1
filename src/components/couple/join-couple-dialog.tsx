"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JoinCoupleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinCoupleDialog({ open, onOpenChange }: JoinCoupleDialogProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formattedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  async function handleJoin() {
    if (formattedCode.length !== 6) {
      setError("Please enter a valid 6-character code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: formattedCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join couple");
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setCode("");
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-pink-500" />
            Join a Couple
          </DialogTitle>
          <DialogDescription>
            Enter the invitation code shared by your partner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Successfully connected!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting you to your couple...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invitation Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-character code"
                  value={formattedCode}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-[0.3em] uppercase"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Example: ABC123
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={loading || formattedCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Couple"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

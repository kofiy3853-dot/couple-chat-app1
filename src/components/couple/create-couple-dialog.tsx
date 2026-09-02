"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvitationDisplay } from "./invitation-display";

interface CreateCoupleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCoupleDialog({ open, onOpenChange }: CreateCoupleDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const coupleRes = await fetch("/api/couples", { method: "POST" });
      const coupleData = await coupleRes.json();

      if (!coupleRes.ok) {
        throw new Error(coupleData.error || "Failed to create couple");
      }

      const inviteRes = await fetch("/api/invitations", { method: "POST" });
      const inviteData = await inviteRes.json();

      if (!inviteRes.ok) {
        throw new Error(inviteData.error || "Failed to create invitation");
      }

      setInvitationCode(inviteData.data.code);
      setExpiresAt(inviteData.data.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (invitationCode) {
      router.refresh();
    }
    setInvitationCode(null);
    setExpiresAt(null);
    setError(null);
    onOpenChange(false);
  }

  if (invitationCode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Invitation Created!
            </DialogTitle>
            <DialogDescription>
              Share this code with your partner so they can join your couple.
            </DialogDescription>
          </DialogHeader>

          <InvitationDisplay code={invitationCode} expiresAt={expiresAt} />

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Create a Couple
          </DialogTitle>
          <DialogDescription>
            This will create a new couple and generate an invitation code for your partner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              After creating, you&apos;ll receive a 6-character code to share with your partner.
              They can use it to join your couple and start chatting.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Couple"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

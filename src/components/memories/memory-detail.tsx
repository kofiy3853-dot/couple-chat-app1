"use client";

import { useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Memory } from "./memories-page";

interface MemoryDetailProps {
  memory: Memory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
  onUpdated: (memory: Memory) => void;
}

export function MemoryDetail({
  memory,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: MemoryDetailProps) {
  const [deleting, setDeleting] = useState(false);

  const formattedDate = new Date(memory.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/memories/${memory.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted(memory.id);
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {memory.imageUrl && (
          <div className="relative -m-6 mb-0 overflow-hidden rounded-t-lg">
            <img
              src={memory.imageUrl}
              alt={memory.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="text-xl">{memory.title}</DialogTitle>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>

        {memory.description && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {memory.description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2 text-sm text-gray-500 dark:text-gray-400">
          <User className="h-4 w-4" />
          <span>Created by {memory.creator.name || "Unknown"}</span>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

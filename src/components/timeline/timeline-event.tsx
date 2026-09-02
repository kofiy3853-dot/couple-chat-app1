"use client";

import { useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimelineEventItem } from "./timeline-page";

interface TimelineEventProps {
  event: TimelineEventItem;
  index: number;
  onDeleted: (id: string) => void;
  onUpdated: (event: TimelineEventItem) => void;
}

export function TimelineEvent({
  event,
  index,
  onDeleted,
  onUpdated,
}: TimelineEventProps) {
  const [deleting, setDeleting] = useState(false);
  const isLeft = index % 2 === 0;

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/timeline/${event.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted(event.id);
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={cn(
        "relative flex items-start gap-8",
        "md:flex-row",
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      )}
    >
      {/* Dot on the line */}
      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-gray-950 z-10 shadow-sm" />

      {/* Hidden spacer for the opposite side on mobile */}
      <div className="hidden md:block md:w-1/2" />

      {/* Event card */}
      <div className={cn("ml-10 md:ml-0 md:w-1/2", !isLeft && "md:text-right")}>
        <div className="group rounded-xl border bg-card shadow hover:shadow-md transition-shadow overflow-hidden">
          {/* Date badge */}
          <div
            className={cn(
              "inline-block px-3 py-1 text-xs font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-br-lg",
              !isLeft && "md:ml-auto md:rounded-bl-lg md:rounded-br-none"
            )}
          >
            {formattedDate}
          </div>

          <div className="p-4 pt-2">
            {event.imageUrl && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {event.title}
            </h3>

            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {event.description}
              </p>
            )}

            <div
              className={cn(
                "flex items-center gap-2 mt-3 text-xs text-gray-400",
                !isLeft && "md:justify-end"
              )}
            >
              <User className="h-3 w-3" />
              <span>{event.creator.name || "Unknown"}</span>
            </div>

            <div
              className={cn(
                "flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                !isLeft && "md:justify-end"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

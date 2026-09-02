"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineEvent } from "./timeline-event";
import { AddEventDialog } from "./add-event-dialog";

export interface TimelineEventItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  date: string;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export function TimelinePage() {
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/timeline");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.data?.events ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  function handleEventAdded(event: TimelineEventItem) {
    setEvents((prev) => [...prev, event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setAddDialogOpen(false);
  }

  function handleEventDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function handleEventUpdated(updated: TimelineEventItem) {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Our Timeline
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            The story of your journey together
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {loading ? (
        <div className="relative space-y-8">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`relative flex items-start gap-8 ${
                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              <div className="hidden md:block md:w-1/2" />
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-950 z-10" />
              <div className="ml-10 md:ml-0 md:w-1/2">
                <div className="rounded-xl border bg-card shadow p-4 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border bg-card shadow">
          <EmptyState
            icon={<Calendar className="h-8 w-8 text-rose-400" />}
            title="Start your story together"
            description="Add meaningful events to build your couple's timeline."
            action={{
              label: "Add First Event",
              onClick: () => setAddDialogOpen(true),
            }}
          />
        </div>
      ) : (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-8">
            {events.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                index={index}
                onDeleted={handleEventDeleted}
                onUpdated={handleEventUpdated}
              />
            ))}
          </div>
        </div>
      )}

      <AddEventDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdded={handleEventAdded}
      />
    </div>
  );
}

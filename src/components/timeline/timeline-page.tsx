"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Plus, Loader2 } from "lucide-react";
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function TimelinePage({ currentUserId }: { currentUserId: string }) {
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchEvents = useCallback(async (page = 1, append = false) => {
    try {
      const res = await fetch(`/api/timeline?page=${page}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const newEvents = data.data?.events ?? [];
        const pag = data.data?.pagination;
        setEvents((prev) => (append ? [...prev, ...newEvents] : newEvents));
        setPagination(pag ?? null);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  function handleLoadMore() {
    if (!pagination?.hasNext || loadingMore) return;
    setLoadingMore(true);
    fetchEvents(pagination.page + 1, true);
  }

  function handleEventAdded(event: TimelineEventItem) {
    setEvents((prev) =>
      [...prev, event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setPagination((prev) =>
      prev ? { ...prev, total: prev.total + 1 } : prev
    );
    setAddDialogOpen(false);
  }

  function handleEventDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setPagination((prev) =>
      prev ? { ...prev, total: prev.total - 1 } : prev
    );
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
            {pagination?.total
              ? `${pagination.total} event${pagination.total === 1 ? "" : "s"} in your story`
              : "The story of your journey together"}
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
        <>
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-8">
              {events.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  index={index}
                  currentUserId={currentUserId}
                  onDeleted={handleEventDeleted}
                  onUpdated={handleEventUpdated}
                />
              ))}
            </div>
          </div>

          {pagination?.hasNext && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}

      <AddEventDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdded={handleEventAdded}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { TimelineEventItem } from "./timeline-page";

interface TimelineEventProps {
  event: TimelineEventItem;
  index: number;
  currentUserId: string;
  onDeleted: (id: string) => void;
  onUpdated: (event: TimelineEventItem) => void;
}

export function TimelineEvent({
  event,
  index,
  currentUserId,
  onDeleted,
  onUpdated,
}: TimelineEventProps) {
  const [deleting, setDeleting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDescription, setEditDescription] = useState(event.description ?? "");
  const [editDate, setEditDate] = useState(event.date?.split("T")[0] ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isLeft = index % 2 === 0;
  const isCreator = event.creator.id === currentUserId;

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const fullDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/timeline/${event.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted(event.id);
        setShowDeleteConfirm(false);
        setShowDetail(false);
        toast({ title: "Event deleted" });
      } else {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || "Failed to delete");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/timeline/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          date: editDate || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || "Failed to update");
      }

      const data = await res.json();
      onUpdated(data.data);
      setEditing(false);
      setShowDetail(false);
      toast({ title: "Event updated" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setEditTitle(event.title);
    setEditDescription(event.description ?? "");
    setEditDate(event.date?.split("T")[0] ?? "");
    setEditing(true);
  }

  return (
    <>
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
          <div
            className="group rounded-xl border bg-card shadow hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
            onClick={() => setShowDetail(true)}
          >
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
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {event.imageUrl && !editing && (
            <div className="relative -m-6 mb-0 overflow-hidden rounded-t-lg">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          )}

          {editing ? (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="What happened..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Date
                </label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{event.title}</DialogTitle>
                <DialogDescription>{fullDate}</DialogDescription>
              </DialogHeader>

              {event.description && (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 text-sm text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span>Created by {event.creator.name || "Unknown"}</span>
              </div>
            </>
          )}

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                {isCreator && (
                  <>
                    <Button variant="outline" size="sm" onClick={startEdit}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{event.title}&rdquo;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

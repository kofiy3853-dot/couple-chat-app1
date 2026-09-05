"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, User, Pencil } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface TimelineEvent {
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

interface TimelineEventDetailViewProps {
  event: TimelineEvent;
  currentUserId: string;
}

export function TimelineEventDetailView({ event, currentUserId }: TimelineEventDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDescription, setEditDescription] = useState(event.description ?? "");
  const [editDate, setEditDate] = useState(event.date?.split("T")[0] ?? "");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCreator = event.creator.id === currentUserId;

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
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
        toast({ title: "Event deleted" });
        router.push("/timeline");
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

      setEditing(false);
      toast({ title: "Event updated" });
      router.refresh();
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/timeline")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Timeline
      </Button>

      {event.imageUrl && !editing && (
        <div className="rounded-xl overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-64 sm:h-96 object-cover"
          />
        </div>
      )}

      <div className="rounded-xl border bg-card shadow p-6 space-y-4">
        {editing ? (
          <div className="space-y-4">
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
                rows={4}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {event.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{formattedDate}</p>

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

        {isCreator && (
          <div className="flex gap-2 pt-4 border-t">
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
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}

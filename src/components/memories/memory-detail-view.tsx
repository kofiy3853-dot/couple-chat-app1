"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, User, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Memory {
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

interface MemoryDetailViewProps {
  memory: Memory;
  currentUserId: string;
}

export function MemoryDetailView({ memory, currentUserId }: MemoryDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(memory.title);
  const [editDescription, setEditDescription] = useState(memory.description ?? "");
  const [editDate, setEditDate] = useState(memory.date?.split("T")[0] ?? "");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const isCreator = memory.creator.id === currentUserId;

  const formattedDate = new Date(memory.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Memory deleted" });
        router.push("/memories");
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
      const res = await fetch(`/api/memories/${memory.id}`, {
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
      toast({ title: "Memory updated" });
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
        onClick={() => router.push("/memories")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Memories
      </Button>

      {memory.imageUrl && !editing && (
        <div className="rounded-xl overflow-hidden">
          <img
            src={memory.imageUrl}
            alt={memory.title}
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
                placeholder="Memory title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Tell the story..."
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
              {memory.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{formattedDate}</p>

            {memory.description && (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {memory.description}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2 text-sm text-gray-500 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span>Created by {memory.creator.name || "Unknown"}</span>
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
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

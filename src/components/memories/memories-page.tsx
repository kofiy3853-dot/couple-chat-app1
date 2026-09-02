"use client";

import { useEffect, useState } from "react";
import { Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "./memory-card";
import { MemoryDetail } from "./memory-detail";
import { AddMemoryDialog } from "./add-memory-dialog";

export interface Memory {
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

export function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  async function fetchMemories() {
    try {
      const res = await fetch("/api/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data.data?.memories ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMemories();
  }, []);

  function handleMemoryAdded(memory: Memory) {
    setMemories((prev) => [memory, ...prev]);
    setAddDialogOpen(false);
  }

  function handleMemoryDeleted(id: string) {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setSelectedMemory(null);
  }

  function handleMemoryUpdated(updated: Memory) {
    setMemories((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
    setSelectedMemory(null);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Our Memories
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Cherished moments you&apos;ve shared together
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Memory
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card shadow p-0 overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="rounded-xl border bg-card shadow">
          <EmptyState
            icon={<Camera className="h-8 w-8 text-rose-400" />}
            title="Start collecting memories together"
            description="Capture your favorite moments — from everyday joy to milestone celebrations."
            action={{
              label: "Add First Memory",
              onClick: () => setAddDialogOpen(true),
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onClick={() => setSelectedMemory(memory)}
            />
          ))}
        </div>
      )}

      {selectedMemory && (
        <MemoryDetail
          memory={selectedMemory}
          open={!!selectedMemory}
          onOpenChange={(open) => {
            if (!open) setSelectedMemory(null);
          }}
          onDeleted={handleMemoryDeleted}
          onUpdated={handleMemoryUpdated}
        />
      )}

      <AddMemoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdded={handleMemoryAdded}
      />
    </div>
  );
}

"use client";

import { Camera, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Memory } from "./memories-page";

interface MemoryCardProps {
  memory: Memory;
  onClick: () => void;
}

export function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const formattedDate = new Date(memory.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {memory.imageUrl ? (
          <img
            src={memory.imageUrl}
            alt={memory.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Camera className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
          {memory.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {formattedDate}
        </p>
        {memory.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
            {memory.description}
          </p>
        )}
      </div>
    </Card>
  );
}

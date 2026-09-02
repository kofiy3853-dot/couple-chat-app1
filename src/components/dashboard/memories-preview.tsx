"use client";

import Link from "next/link";
import Image from "next/image";
import { Camera, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Memory {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  date: string;
}

interface MemoriesPreviewProps {
  memories: Memory[];
}

export function MemoriesPreview({ memories }: MemoriesPreviewProps) {
  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4 text-rose-500" />
          Our Memories
        </CardTitle>
        <Link
          href="/memories"
          className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <Camera className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              No memories yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-[200px]">
              Capture special moments together.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/memories">
                <Plus className="h-3 w-3 mr-1" />
                Add memory
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {memories.slice(0, 4).map((memory) => (
                <div
                  key={memory.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
                >
                  {memory.imageUrl ? (
                    <Image
                      src={memory.imageUrl}
                      alt={memory.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium truncate">
                      {memory.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/memories">
                  <Plus className="h-3 w-3 mr-1" />
                  Add memory
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

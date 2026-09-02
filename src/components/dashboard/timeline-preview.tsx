"use client";

import Link from "next/link";
import { Calendar, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TimelinePreview() {
  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-rose-500" />
          Our Story
        </CardTitle>
        <Link
          href="/timeline"
          className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
            <Calendar className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            No events yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-[200px]">
            Add milestones and special moments to your timeline.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/timeline">
              <Plus className="h-3 w-3 mr-1" />
              Add event
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

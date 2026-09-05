"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mb-6">
        <span className="text-2xl">💔</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        We couldn&apos;t load your dashboard. Please try again.
      </p>
      <Button
        onClick={reset}
        className="bg-rose-500 hover:bg-rose-600 text-white"
      >
        Try again
      </Button>
    </div>
  );
}

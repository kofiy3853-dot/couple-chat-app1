"use client";

import { WifiOff, RefreshCw } from "lucide-react";

interface ConnectionBannerProps {
  connected: boolean;
  reconnectFailed: boolean;
}

export function ConnectionBanner({ connected, reconnectFailed }: ConnectionBannerProps) {
  if (connected && !reconnectFailed) return null;

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium shrink-0",
      reconnectFailed
        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-800"
        : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-b border-yellow-200 dark:border-yellow-800"
    )}>
      {reconnectFailed ? (
        <>
          <RefreshCw className="h-3 w-3" />
          <span>Disconnected. Messages won&apos;t be delivered.</span>
          <button
            onClick={() => window.location.reload()}
            className="underline hover:no-underline ml-1"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 animate-pulse" />
          <span>Reconnecting...</span>
        </>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

import { Heart } from "lucide-react";

export function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
        <Heart className="h-8 w-8 text-rose-500" fill="currentColor" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No conversation yet
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Connect with your partner to start chatting. Once you&apos;re connected,
        your conversations will appear here.
      </p>
    </div>
  );
}

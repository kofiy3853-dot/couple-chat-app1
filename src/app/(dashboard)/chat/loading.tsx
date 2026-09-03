export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <div className="animate-pulse border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

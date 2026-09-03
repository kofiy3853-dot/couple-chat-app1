export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="flex -space-x-3">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 ring-2 ring-rose-400" />
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 ring-2 ring-rose-400" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>

      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />

      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      ))}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <div className="flex flex-col gap-1 max-w-[70%]">
              {i % 2 !== 0 && <Skeleton className="h-3 w-16 self-end" />}
              <Skeleton className={`h-10 ${i % 2 === 0 ? "w-48" : "w-36"}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-2">
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

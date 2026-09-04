export function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400">
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
      </span>
      <span>typing</span>
    </span>
  );
}

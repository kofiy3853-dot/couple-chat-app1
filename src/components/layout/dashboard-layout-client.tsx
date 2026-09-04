"use client";

import { usePathname } from "next/navigation";

interface DashboardLayoutClientProps {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
  /** When true, renders the <main> wrapper for page content instead of the header slot */
  mainOnly?: boolean;
  children: React.ReactNode;
}

export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className={isChat ? "flex flex-col h-screen" : "lg:pl-64 flex flex-col h-screen"}>
      {children}
    </div>
  );
}

export function ContentArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className={isChat ? "flex-1 overflow-hidden" : "flex-1 overflow-hidden pb-16 lg:pb-0"}>
      {children}
    </div>
  );
}

/**
 * Client-side layout wrapper that checks the live pathname.
 * - When NOT mainOnly: renders the Header, but hides it on /chat/* routes.
 * - When mainOnly:     renders the <main> element with the right padding/height
 *                      for the current route (full-height + no padding for chat).
 */
export function DashboardLayoutClient({
  mainOnly,
  children,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const isChat = pathname === "/chat" || pathname.startsWith("/chat/");

  if (mainOnly) {
    return (
      <main
        className={
          isChat
            ? "flex flex-col flex-1 min-h-0 overflow-hidden"
            : "flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8"
        }
      >
        {children}
      </main>
    );
  }

  // Header slot — hidden on chat routes
  if (isChat) return null;

  return <>{children}</>;
}

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
    <div className={isChat ? "flex flex-col h-screen lg:pl-64" : "lg:pl-64 flex flex-col h-screen"}>
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

  if (isChat) return null;

  return <>{children}</>;
}

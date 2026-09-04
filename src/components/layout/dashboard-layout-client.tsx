"use client";

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
  return (
    <div className="lg:pl-64 flex flex-col h-screen">
      {children}
    </div>
  );
}

export function ContentArea({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-hidden pb-16 lg:pb-0">
      {children}
    </div>
  );
}

/**
 * Client-side layout wrapper.
 * - When NOT mainOnly: renders the Header.
 * - When mainOnly: renders the <main> element with padding.
 */
export function DashboardLayoutClient({
  mainOnly,
  children,
}: DashboardLayoutClientProps) {
  if (mainOnly) {
    return (
      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {children}
      </main>
    );
  }

  return <>{children}</>;
}

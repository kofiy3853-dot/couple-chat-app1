import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const coupleMember = await db.coupleMember.findFirst({
    where: { userId: currentUser.id },
  });
  const hasCouple = !!coupleMember;

  // Determine current pathname via Next.js request headers.
  // The chat page has its own ChatHeader, so we suppress the global Header there.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isChat = pathname === "/chat";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        hasCouple={hasCouple}
        user={currentUser}
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        {!isChat && (
          <Header
            user={currentUser}
          />
        )}

        <main className={isChat ? "flex-1 overflow-hidden" : "flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8"}>
          {children}
        </main>
      </div>

      <MobileNav hasCouple={hasCouple} />
    </div>
  );
}
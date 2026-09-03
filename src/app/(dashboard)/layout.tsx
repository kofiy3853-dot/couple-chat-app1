import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        hasCouple={hasCouple}
        user={currentUser}
      />

      <div className="lg:pl-[280px] flex flex-col h-screen">
        <DashboardLayoutClient user={currentUser}>
          <Header user={currentUser} />
        </DashboardLayoutClient>

        <DashboardLayoutClient user={currentUser} mainOnly>
          {children}
        </DashboardLayoutClient>
      </div>

      <MobileNav hasCouple={hasCouple} />
    </div>
  );
}
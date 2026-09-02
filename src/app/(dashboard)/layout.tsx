import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const coupleMember = await db.coupleMember.findFirst({
    where: { userId: session.user.id },
  });
  const hasCouple = !!coupleMember;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        hasCouple={hasCouple}
        user={{
          id: session.user.id ?? "",
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          username: (session.user as Record<string, unknown>).username as string | null | undefined,
        }}
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <Header
          user={{
            id: session.user.id ?? "",
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileNav hasCouple={hasCouple} />
    </div>
  );
}

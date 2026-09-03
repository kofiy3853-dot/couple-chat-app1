import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

// Demo users - using fixed UUIDs matching the seed
const NAOMI_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MICKY_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const DEMO_USERS = [
  { id: NAOMI_ID, name: "Naomi", email: "naomi@example.com", username: "naomi", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naomi" },
  { id: MICKY_ID, name: "Micky", email: "micky@example.com", username: "micky", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Micky" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In demo mode, default to Naomi as the current user
  const currentUser = DEMO_USERS[0];

  const coupleMember = await db.coupleMember.findFirst({
    where: { userId: currentUser.id },
  });
  const hasCouple = !!coupleMember;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        hasCouple={hasCouple}
        user={currentUser}
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <Header
          user={currentUser}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileNav hasCouple={hasCouple} />
    </div>
  );
}
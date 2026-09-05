import { db } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { NoCoupleView } from "@/components/dashboard/no-couple-view";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  DashboardLayoutClient,
  MainContentWrapper,
  ContentArea,
} from "@/components/layout/dashboard-layout-client";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { getDashboardData } from "@/lib/dashboard-data";

async function DashboardShell({
  currentUser,
}: {
  currentUser: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
    username: string | null;
  };
}) {
  const data = await getDashboardData(currentUser.id);

  if (!data) {
    return (
      <DashboardPageShell currentUser={currentUser}>
        <NoCoupleView userName={currentUser.name?.split(" ")[0] || "there"} />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell currentUser={currentUser}>
      <DashboardContent
        userName={currentUser.name?.split(" ")[0] || "there"}
        partner={{ name: data.partner.name, image: data.partner.image }}
        daysTogether={data.daysTogether}
        messageCount={data.messageCount}
        memoryCount={data.memoryCount}
        conversationId={data.conversationId}
        recentMessages={data.recentMessages}
        recentMemories={data.recentMemories}
        recentTimelineEvents={data.recentTimelineEvents}
        unreadNotifications={data.unreadNotifications}
        anniversaryDate={data.anniversaryDate}
      />
    </DashboardPageShell>
  );
}

function DashboardPageShell({
  currentUser,
  children,
}: {
  currentUser: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
    username: string | null;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar hasCouple={true} user={currentUser} />

      <MainContentWrapper>
        <DashboardLayoutClient user={currentUser}>
          <Header user={currentUser} />
        </DashboardLayoutClient>

        <DashboardLayoutClient user={currentUser} mainOnly>
          <ContentArea>{children}</ContentArea>
        </DashboardLayoutClient>
      </MainContentWrapper>

      <MobileNav hasCouple={true} />
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="flex flex-col min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <Footer />
      </main>
    );
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      username: true,
    },
  });

  if (!currentUser) {
    return (
      <main className="flex flex-col min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <Footer />
      </main>
    );
  }

  return <DashboardShell currentUser={currentUser} />;
}

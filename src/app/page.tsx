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
  const userId = currentUser.id;

  const coupleMember = await db.coupleMember.findFirst({
    where: { userId },
    include: {
      couple: {
        select: {
          id: true,
          anniversaryDate: true,
        },
      },
    },
  });

  const couple = coupleMember?.couple;
  if (!couple) {
    return (
      <DashboardPageShell currentUser={currentUser}>
        <NoCoupleView userName={currentUser.name?.split(" ")[0] || "there"} />
      </DashboardPageShell>
    );
  }

  const [partnerMember, conversation, memories, notifications] =
    await Promise.all([
      db.coupleMember.findFirst({
        where: { coupleId: couple.id, userId: { not: userId } },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      db.conversation.findUnique({
        where: { coupleId: couple.id },
        select: { id: true },
      }),
      db.memory.findMany({
        where: { coupleId: couple.id },
        orderBy: { date: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          date: true,
        },
      }),
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const messageCount = conversation?.id
    ? await db.message.count({ where: { conversationId: conversation.id } })
    : 0;

  const partner = partnerMember?.user;
  if (!partner) {
    return (
      <DashboardPageShell currentUser={currentUser}>
        <NoCoupleView userName={currentUser.name?.split(" ")[0] || "there"} />
      </DashboardPageShell>
    );
  }

  const now = new Date();
  let daysTogether = 0;
  if (couple.anniversaryDate) {
    daysTogether = Math.floor(
      (now.getTime() - new Date(couple.anniversaryDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  } else if (coupleMember?.joinedAt) {
    daysTogether = Math.floor(
      (now.getTime() - new Date(coupleMember.joinedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  const recentMessages = conversation?.id
    ? (
        await db.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            sender: {
              select: { id: true, name: true, image: true },
            },
          },
        })
      ).map((msg) => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
      }))
    : [];

  const recentMemories = memories.map((mem) => ({
    ...mem,
    date: mem.date.toISOString(),
  }));

  return (
    <DashboardPageShell currentUser={currentUser}>
      <DashboardContent
        userName={currentUser.name?.split(" ")[0] || "there"}
        partner={{ name: partner.name, image: partner.image }}
        daysTogether={daysTogether}
        messageCount={messageCount}
        memoryCount={memories.length}
        conversationId={conversation?.id || null}
        recentMessages={recentMessages}
        recentMemories={recentMemories}
        unreadNotifications={notifications.length}
        anniversaryDate={
          couple.anniversaryDate
            ? couple.anniversaryDate.toISOString()
            : null
        }
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

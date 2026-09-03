import { db } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { NoCoupleView } from "@/components/dashboard/no-couple-view";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      coupleMembers: {
        include: {
          couple: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      image: true,

                    },
                  },
                },
              },
              conversation: {
                include: {
                  messages: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: {
                      sender: {
                        select: {
                          id: true,
                          name: true,
                          image: true,
                        },
                      },
                    },
                  },
                },
              },
              memories: {
                orderBy: { date: "desc" },
                take: 4,
              },
            },
          },
        },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    // Should not happen in demo mode, but handle gracefully
    return <NoCoupleView userName="there" />;
  }

  const coupleMember = user.coupleMembers[0];
  const couple = coupleMember?.couple;
  const partner = couple?.members.find(
    (m: { userId: string }) => m.userId !== user.id
  )?.user;

  if (!couple || !partner) {
    return <NoCoupleView userName={user.name?.split(" ")[0] || "there"} />;
  }

  const messageCount = couple.conversation?.messages.length || 0;
  const memoryCount = couple.memories.length || 0;

  const now = new Date();
  const daysTogether = coupleMember?.joinedAt
    ? Math.floor(
        (now.getTime() - new Date(coupleMember.joinedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const recentMessages = (couple.conversation?.messages || []).map(
    (msg: {
      id: string;
      content: string;
      type: string;
      createdAt: Date;
      sender: { id: string; name: string | null; image: string | null };
    }) => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
    })
  );

  const recentMemories = couple.memories.map(
    (mem: {
      id: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      date: Date;
    }) => ({
      ...mem,
      date: mem.date.toISOString(),
    })
  );

  const unreadNotifications = user.notifications.length;

  return (
    <DashboardContent
      userName={user.name?.split(" ")[0] || "there"}
      partner={{
        name: partner.name,
        image: partner.image,

      }}
      daysTogether={daysTogether}
      messageCount={messageCount}
      memoryCount={memoryCount}
      conversationId={couple.conversation?.id || null}
      recentMessages={recentMessages}
      recentMemories={recentMemories}
      unreadNotifications={unreadNotifications}
    />
  );
}
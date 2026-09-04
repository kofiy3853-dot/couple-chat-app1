import { db } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { NoCoupleView } from "@/components/dashboard/no-couple-view";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, coupleMember] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
      },
    }),
    db.coupleMember.findFirst({
      where: { userId },
      include: {
        couple: {
          select: {
            id: true,
            anniversaryDate: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    return <NoCoupleView userName="there" />;
  }

  const couple = coupleMember?.couple;
  if (!couple) {
    return <NoCoupleView userName={user.name?.split(" ")[0] || "there"} />;
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
    return <NoCoupleView userName={user.name?.split(" ")[0] || "there"} />;
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
    <DashboardContent
      userName={user.name?.split(" ")[0] || "there"}
      partner={{ name: partner.name, image: partner.image }}
      daysTogether={daysTogether}
      messageCount={messageCount}
      memoryCount={memories.length}
      conversationId={conversation?.id || null}
      recentMessages={recentMessages}
      recentMemories={recentMemories}
      unreadNotifications={notifications.length}
      anniversaryDate={
        couple.anniversaryDate ? couple.anniversaryDate.toISOString() : null
      }
    />
  );
}

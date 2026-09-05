import { db } from "@/lib/db";

export interface DashboardData {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  partner: {
    id: string;
    name: string | null;
    image: string | null;
  };
  daysTogether: number;
  messageCount: number;
  memoryCount: number;
  conversationId: string | null;
  recentMessages: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender: { id: string; name: string | null; image: string | null };
  }[];
  recentMemories: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    date: string;
  }[];
  recentTimelineEvents: {
    id: string;
    title: string;
    description: string | null;
    date: string;
  }[];
  unreadNotifications: number;
  anniversaryDate: string | null;
}

export async function getDashboardData(
  userId: string
): Promise<DashboardData | null> {
  const coupleMember = await db.coupleMember.findFirst({
    where: { userId },
    include: {
      couple: {
        select: { id: true, anniversaryDate: true },
      },
    },
  });

  const couple = coupleMember?.couple;
  if (!couple) return null;

  const [partnerMember, conversation, memories, timelineEvents, notifications] =
    await Promise.all([
      db.coupleMember.findFirst({
        where: { coupleId: couple.id, userId: { not: userId } },
        include: {
          user: { select: { id: true, name: true, image: true } },
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
      db.timelineEvent.findMany({
        where: { coupleId: couple.id },
        orderBy: { date: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
        },
      }),
      db.notification.count({
        where: { userId, read: false },
      }),
    ]);

  const partner = partnerMember?.user;
  if (!partner) return null;

  const messageCount = conversation?.id
    ? await db.message.count({ where: { conversationId: conversation.id } })
    : 0;

  const now = new Date();
  let daysTogether = 0;
  if (couple.anniversaryDate) {
    daysTogether = Math.floor(
      (now.getTime() - new Date(couple.anniversaryDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  } else if (coupleMember.joinedAt) {
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
            sender: { select: { id: true, name: true, image: true } },
          },
        })
      ).map((msg) => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
      }))
    : [];

  return {
    user: { id: userId, name: partner.name, image: partner.image },
    partner,
    daysTogether,
    messageCount,
    memoryCount: memories.length,
    conversationId: conversation?.id || null,
    recentMessages,
    recentMemories: memories.map((m) => ({
      ...m,
      date: m.date.toISOString(),
    })),
    recentTimelineEvents: timelineEvents.map((e) => ({
      ...e,
      date: e.date.toISOString(),
    })),
    unreadNotifications: notifications,
    anniversaryDate: couple.anniversaryDate
      ? couple.anniversaryDate.toISOString()
      : null,
  };
}

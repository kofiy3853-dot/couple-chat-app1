/**
 * Prisma Seed File — Couple Chat Application
 *
 * This file populates the database with development/demo data:
 *   - 2 users (Naomi, Micky)
 *   - 1 couple (Naomi + Micky)
 *   - 1 conversation with messages
 *   - Example memories, timeline events, notifications
 *   - Privacy settings for all users
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, MessageType, NotificationType } from "@prisma/client";
import { v4 as uuid } from "uuid";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);

// Use fixed UUIDs for demo users
const NAOMI_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MICKY_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const COUPLE_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const CONV_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const MEMORY_1_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const MEMORY_2_ID = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const MEMORY_3_ID = "00000000-0000-0000-0000-000000000001";

const TIMELINE_1_ID = "00000000-0000-0000-0000-000000000002";
const TIMELINE_2_ID = "00000000-0000-0000-0000-000000000003";
const TIMELINE_3_ID = "00000000-0000-0000-0000-000000000004";

const NOTIF_1_ID = "00000000-0000-0000-0000-000000000005";
const NOTIF_2_ID = "00000000-0000-0000-0000-000000000006";
const NOTIF_3_ID = "00000000-0000-0000-0000-000000000007";

const INVITE_ID = "00000000-0000-0000-0000-000000000008";

const REACTION_1_ID = "00000000-0000-0000-0000-000000000009";
const REACTION_2_ID = "00000000-0000-0000-0000-000000000010";

const PRIVACY_NAOMI_ID = "00000000-0000-0000-0000-000000000011";
const PRIVACY_MICKY_ID = "00000000-0000-0000-0000-000000000012";

const MEMBER_NAOMI_ID = "00000000-0000-0000-0000-000000000013";
const MEMBER_MICKY_ID = "00000000-0000-0000-0000-000000000014";

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // Skip if already seeded
  const existing = await prisma.user.findFirst({
    where: { email: "naomi@example.com" },
  });
  if (existing) {
    console.log("✅ Database already seeded, skipping.");
    return;
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  const naomi = await prisma.user.upsert({
    where: { id: NAOMI_ID },
    update: {},
    create: {
      id: NAOMI_ID,
      name: "Naomi",
      email: "naomi@example.com",
      username: "naomi",
      password: await hash("Naomi@123", 10),
      bio: "Love coffee, sunsets, and long walks on the beach ☕🌅",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naomi",
    },
  });
  console.log(`✅ Created user: ${naomi.email}`);

  const micky = await prisma.user.upsert({
    where: { id: MICKY_ID },
    update: {},
    create: {
      id: MICKY_ID,
      name: "Micky",
      email: "micky@example.com",
      username: "micky",
      password: await hash("Nharnah@12", 10),
      bio: "Music lover, amateur chef, dog dad 🎵👨‍🍳🐕",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Micky",
    },
  });
  console.log(`✅ Created user: ${micky.email}`);

  // ── Couple ────────────────────────────────────────────────────────────────

  const couple = await prisma.couple.create({
    data: {
      id: COUPLE_ID,
    },
  });

  await prisma.coupleMember.createMany({
    data: [
      { id: MEMBER_NAOMI_ID, coupleId: couple.id, userId: naomi.id, joinedAt: daysAgo(12) },
      { id: MEMBER_MICKY_ID, coupleId: couple.id, userId: micky.id, joinedAt: daysAgo(12) },
    ],
  });
  console.log(`✅ Created couple (Naomi + Micky) with ${2} members`);

  // ── Conversation ──────────────────────────────────────────────────────────

  const conversation = await prisma.conversation.create({
    data: {
      id: CONV_ID,
      coupleId: couple.id,
    },
  });
  console.log(`✅ Created conversation`);

  // ── Messages ──────────────────────────────────────────────────────────────

  const messageData: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: MessageType;
    createdAt: Date;
  }[] = [
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: naomi.id,
      content: "Hey Micky! How was your day? 💕",
      type: MessageType.TEXT,
      createdAt: minutesAgo(120),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: micky.id,
      content: "It was great! I finally nailed that pasta recipe you shared with me 🍝",
      type: MessageType.TEXT,
      createdAt: minutesAgo(115),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: naomi.id,
      content: "Wait, the carbonara?? Omg I need to try it tonight!",
      type: MessageType.TEXT,
      createdAt: minutesAgo(110),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: micky.id,
      content: "Yes! I'll make it for you. But first — want to go to that new bookshop on 5th street this weekend?",
      type: MessageType.TEXT,
      createdAt: minutesAgo(105),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: naomi.id,
      content: "Absolutely! I heard they have a cute café inside too ☕📖",
      type: MessageType.TEXT,
      createdAt: minutesAgo(100),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: micky.id,
      content: "Perfect. Date night plan: bookshop → café → homemade carbonara 🍷",
      type: MessageType.TEXT,
      createdAt: minutesAgo(95),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: naomi.id,
      content: "You're the best. Also — I made us a playlist for the road trip next month 🎶",
      type: MessageType.TEXT,
      createdAt: minutesAgo(60),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: micky.id,
      content: "You did?? Send it now! I'm so excited for that trip honestly",
      type: MessageType.TEXT,
      createdAt: minutesAgo(55),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: naomi.id,
      content: "It's got that one song we always sing in the car — you know the one 😂",
      type: MessageType.TEXT,
      createdAt: minutesAgo(50),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: micky.id,
      content: "No way — our song?? I love you so much ❤️",
      type: MessageType.TEXT,
      createdAt: minutesAgo(45),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: naomi.id,
      content: "Love you too! Can't wait for this weekend 🥰",
      type: MessageType.TEXT,
      createdAt: minutesAgo(40),
    },
    {
      id: uuid(),
      conversationId: conversation.id,
      senderId: micky.id,
      content: "Me neither. Goodnight, my love! 💤",
      type: MessageType.TEXT,
      createdAt: minutesAgo(30),
    },
  ];

  const createdMessages = [];
  for (const msgData of messageData) {
    const msg = await prisma.message.create({
      data: msgData,
    });
    createdMessages.push(msg);
  }
  console.log(`✅ Created ${createdMessages.length} messages`);

  // ── Reactions ─────────────────────────────────────────────────────────────

  await prisma.messageReaction.create({
    data: {
      id: REACTION_1_ID,
      messageId: createdMessages[9].id,
      userId: naomi.id,
      emoji: "❤️",
    },
  });
  await prisma.messageReaction.create({
    data: {
      id: REACTION_2_ID,
      messageId: createdMessages[8].id,
      userId: micky.id,
      emoji: "😂",
    },
  });
  console.log(`✅ Created 2 message reactions`);

  // ── Memories ──────────────────────────────────────────────────────────────

  await prisma.memory.create({
    data: {
      id: MEMORY_1_ID,
      coupleId: couple.id,
      creatorId: naomi.id,
      title: "First Date at the Rooftop Bar",
      description: "The night we met at that rooftop bar downtown. Micky spilled his drink and I laughed so hard I cried. Best night ever!",
      imageUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800",
      date: daysAgo(180),
    },
  });

  await prisma.memory.create({
    data: {
      id: MEMORY_2_ID,
      coupleId: couple.id,
      creatorId: micky.id,
      title: "Weekend Trip to the Mountains",
      description: "Surprise weekend getaway. The cabin had no WiFi and we loved every second of it. Board games, hot cocoa, and stargazing.",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      date: daysAgo(90),
    },
  });

  await prisma.memory.create({
    data: {
      id: MEMORY_3_ID,
      coupleId: couple.id,
      creatorId: naomi.id,
      title: "Adopted Milo 🐕",
      description: "The day we adopted Milo from the shelter. He stole our hearts immediately. Micky cried first, not me (okay, maybe I did too).",
      imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
      date: daysAgo(60),
    },
  });
  console.log(`✅ Created 3 memories`);

  // ── Timeline Events ───────────────────────────────────────────────────────

  await prisma.timelineEvent.create({
    data: {
      id: TIMELINE_1_ID,
      coupleId: couple.id,
      creatorId: naomi.id,
      title: "We Became Official",
      description: "The day Micky asked me to be his girlfriend. He was so nervous he forgot his speech.",
      date: daysAgo(170),
    },
  });

  await prisma.timelineEvent.create({
    data: {
      id: TIMELINE_2_ID,
      coupleId: couple.id,
      creatorId: micky.id,
      title: "Naomi Met My Parents",
      description: "She won over my mom with her lemon tart recipe. Dad approved after the football chat.",
      date: daysAgo(120),
    },
  });

  await prisma.timelineEvent.create({
    data: {
      id: TIMELINE_3_ID,
      coupleId: couple.id,
      creatorId: naomi.id,
      title: "First Anniversary Dinner",
      description: "Dinner at that Italian place downtown. Micky surprised me with a handwritten letter. Still have it framed on my desk.",
      date: daysAgo(30),
    },
  });
  console.log(`✅ Created 3 timeline events`);

  // ── Notifications ─────────────────────────────────────────────────────────

  await prisma.notification.create({
    data: {
      id: NOTIF_1_ID,
      userId: naomi.id,
      type: NotificationType.MESSAGE,
      title: "New Message",
      message: "Micky sent you a message: \"Love you too! Can't wait for this weekend 🥰\"",
      read: false,
      link: `/chat`,
    },
  });

  await prisma.notification.create({
    data: {
      id: NOTIF_2_ID,
      userId: micky.id,
      type: NotificationType.MEMORY,
      title: "New Memory Shared",
      message: "Naomi added a new memory: \"Adopted Milo 🐕\"",
      read: true,
      link: `/memories`,
    },
  });

  await prisma.notification.create({
    data: {
      id: NOTIF_3_ID,
      userId: naomi.id,
      type: NotificationType.TIMELINE,
      title: "Timeline Update",
      message: "Micky added a timeline event: \"Naomi Met My Parents\"",
      read: false,
      link: `/timeline`,
    },
  });
  console.log(`✅ Created 3 notifications`);

  // ── Invitation Codes ──────────────────────────────────────────────────────

  await prisma.coupleInvitation.create({
    data: {
      id: INVITE_ID,
      code: "DEMO-CODE-2024",
      creatorId: naomi.id,
      coupleId: couple.id,
      expiresAt: daysAgo(-30), // 30 days from now
    },
  });
  console.log(`✅ Created unused invitation code: DEMO-CODE-2024`);

  // ── Privacy Settings ──────────────────────────────────────────────────────

  await prisma.userPrivacySetting.createMany({
    data: [
      {
        id: PRIVACY_NAOMI_ID,
        userId: naomi.id,
        showOnlineStatus: true,
        showLastSeen: true,
        readReceipts: true,
      },
      {
        id: PRIVACY_MICKY_ID,
        userId: micky.id,
        showOnlineStatus: true,
        showLastSeen: false, // Micky hides last seen
        readReceipts: true,
      },
    ],
  });
  console.log(`✅ Created privacy settings for 2 users`);

  console.log("\n🎉 Seed complete!");
  console.log("────────────────────────────────────────");
  console.log("📧 Naomi:  naomi@example.com  / Naomi@123");
  console.log("📧 Micky:  micky@example.com  / Nharnah@12");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
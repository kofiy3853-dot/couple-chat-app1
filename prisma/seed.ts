/**
 * Prisma Seed File — Couple Chat Application
 *
 * This file populates the database with development/demo data:
 *   - 3 users (admin, alice, bob)
 *   - 1 couple (Alice + Bob)
 *   - 1 conversation with 10+ messages
 *   - Example memories, timeline events, notifications
 *   - Privacy settings for all users
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, UserRole, MessageType, NotificationType } from "@prisma/client";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  const adminPassword = await hashPassword("Admin123!");
  const userPassword = await hashPassword("Password123!");

  // ── Users ─────────────────────────────────────────────────────────────────

  const admin = await prisma.user.create({
    data: {
      id: uuid(),
      name: "Admin",
      email: "admin@example.com",
      emailVerified: daysAgo(30),
      password: adminPassword,
      role: UserRole.ADMIN,
      username: "admin",
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  const alice = await prisma.user.create({
    data: {
      id: uuid(),
      name: "Alice Johnson",
      email: "alice@example.com",
      emailVerified: daysAgo(14),
      password: userPassword,
      username: "alice",
      bio: "Love coffee, sunsets, and long walks on the beach ☕🌅",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    },
  });
  console.log(`✅ Created user: ${alice.email}`);

  const bob = await prisma.user.create({
    data: {
      id: uuid(),
      name: "Bob Smith",
      email: "bob@example.com",
      emailVerified: daysAgo(14),
      password: userPassword,
      username: "bob",
      bio: "Music lover, amateur chef, dog dad 🎵👨‍🍳🐕",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    },
  });
  console.log(`✅ Created user: ${bob.email}`);

  // ── Couple ────────────────────────────────────────────────────────────────

  const couple = await prisma.couple.create({
    data: {
      id: uuid(),
    },
  });

  await prisma.coupleMember.createMany({
    data: [
      { id: uuid(), coupleId: couple.id, userId: alice.id, joinedAt: daysAgo(12) },
      { id: uuid(), coupleId: couple.id, userId: bob.id, joinedAt: daysAgo(12) },
    ],
  });
  console.log(`✅ Created couple (Alice + Bob) with ${2} members`);

  // ── Conversation ──────────────────────────────────────────────────────────

  const conversation = await prisma.conversation.create({
    data: {
      id: uuid(),
      coupleId: couple.id,
    },
  });
  console.log(`✅ Created conversation`);

  // ── Messages ──────────────────────────────────────────────────────────────

  const messageData: {
    conversationId: string;
    senderId: string;
    content: string;
    type: MessageType;
    createdAt: Date;
  }[] = [
    {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "Hey Bob! How was your day? 💕",
      type: MessageType.TEXT,
      createdAt: minutesAgo(120),
    },
    {
      conversationId: conversation.id,
      senderId: bob.id,
      content: "It was great! I finally nailed that pasta recipe you shared with me 🍝",
      type: MessageType.TEXT,
      createdAt: minutesAgo(115),
    },
    {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "Wait, the carbonara?? Omg I need to try it tonight!",
      type: MessageType.TEXT,
      createdAt: minutesAgo(110),
    },
    {
      conversationId: conversation.id,
      senderId: bob.id,
      content: "Yes! I'll make it for you. But first — want to go to that new bookshop on 5th street this weekend?",
      type: MessageType.TEXT,
      createdAt: minutesAgo(105),
    },
    {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "Absolutely! I heard they have a cute café inside too ☕📖",
      type: MessageType.TEXT,
      createdAt: minutesAgo(100),
    },
    {
      conversationId: conversation.id,
      senderId: bob.id,
      content: "Perfect. Date night plan: bookshop → café → homemade carbonara 🍷",
      type: MessageType.TEXT,
      createdAt: minutesAgo(95),
    },
    {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "You're the best. Also — I made us a playlist for the road trip next month 🎶",
      type: MessageType.TEXT,
      createdAt: minutesAgo(60),
    },
    {
      conversationId: conversation.id,
      senderId: bob.id,
      content: "You did?? Send it now! I'm so excited for that trip honestly",
      type: MessageType.TEXT,
      createdAt: minutesAgo(55),
    },
    {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "It's got that one song we always sing in the car — you know the one 😂",
      type: MessageType.TEXT,
      createdAt: minutesAgo(50),
    },
    {
      conversationId: conversation.id,
      senderId: bob.id,
      content: "No way — our song?? I love you so much ❤️",
      type: MessageType.TEXT,
      createdAt: minutesAgo(45),
    },
    {
      conversationId: conversation.id,
      senderId: alice.id,
      content: "Love you too! Can't wait for this weekend 🥰",
      type: MessageType.TEXT,
      createdAt: minutesAgo(40),
    },
    {
      conversationId: conversation.id,
      senderId: bob.id,
      content: "Me neither. Goodnight, my love! 💤",
      type: MessageType.TEXT,
      createdAt: minutesAgo(30),
    },
  ];

  // Stagger createdAt so messages have distinct timestamps
  const createdMessages = [];
  for (let i = 0; i < messageData.length; i++) {
    const msg = await prisma.message.create({
      data: {
        ...messageData[i],
        createdAt: minutesAgo(120 - i * 10),
      },
    });
    createdMessages.push(msg);
  }
  console.log(`✅ Created ${createdMessages.length} messages`);

  // ── Reactions ─────────────────────────────────────────────────────────────

  await prisma.messageReaction.create({
    data: {
      id: uuid(),
      messageId: createdMessages[9].id,
      userId: alice.id,
      emoji: "❤️",
    },
  });
  await prisma.messageReaction.create({
    data: {
      id: uuid(),
      messageId: createdMessages[8].id,
      userId: bob.id,
      emoji: "😂",
    },
  });
  console.log(`✅ Created 2 message reactions`);

  // ── Memories ──────────────────────────────────────────────────────────────

  await prisma.memory.create({
    data: {
      id: uuid(),
      coupleId: couple.id,
      creatorId: alice.id,
      title: "First Date at the Rooftop Bar",
      description: "The night we met at that rooftop bar downtown. Bob spilled his drink and I laughed so hard I cried. Best night ever!",
      imageUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800",
      date: daysAgo(180),
    },
  });

  await prisma.memory.create({
    data: {
      id: uuid(),
      coupleId: couple.id,
      creatorId: bob.id,
      title: "Weekend Trip to the Mountains",
      description: "Surprise weekend getaway. The cabin had no WiFi and we loved every second of it. Board games, hot cocoa, and stargazing.",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      date: daysAgo(90),
    },
  });

  await prisma.memory.create({
    data: {
      id: uuid(),
      coupleId: couple.id,
      creatorId: alice.id,
      title: "Adopted Milo 🐕",
      description: "The day we adopted Milo from the shelter. He stole our hearts immediately. Bob cried first, not me (okay, maybe I did too).",
      imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
      date: daysAgo(60),
    },
  });
  console.log(`✅ Created 3 memories`);

  // ── Timeline Events ───────────────────────────────────────────────────────

  await prisma.timelineEvent.create({
    data: {
      id: uuid(),
      coupleId: couple.id,
      creatorId: alice.id,
      title: "We Became Official",
      description: "The day Bob asked me to be his girlfriend. He was so nervous he forgot his speech.",
      date: daysAgo(170),
    },
  });

  await prisma.timelineEvent.create({
    data: {
      id: uuid(),
      coupleId: couple.id,
      creatorId: bob.id,
      title: "Alice Met My Parents",
      description: "She won over my mom with her lemon tart recipe. Dad approved after the football chat.",
      date: daysAgo(120),
    },
  });

  await prisma.timelineEvent.create({
    data: {
      id: uuid(),
      coupleId: couple.id,
      creatorId: alice.id,
      title: "First Anniversary Dinner",
      description: "Dinner at that Italian place downtown. Bob surprised me with a handwritten letter. Still have it framed on my desk.",
      date: daysAgo(30),
    },
  });
  console.log(`✅ Created 3 timeline events`);

  // ── Notifications ─────────────────────────────────────────────────────────

  await prisma.notification.create({
    data: {
      id: uuid(),
      userId: alice.id,
      type: NotificationType.MESSAGE,
      title: "New Message",
      message: "Bob sent you a message: \"Love you too! Can't wait for this weekend 🥰\"",
      read: false,
      link: `/chat`,
    },
  });

  await prisma.notification.create({
    data: {
      id: uuid(),
      userId: bob.id,
      type: NotificationType.MEMORY,
      title: "New Memory Shared",
      message: "Alice added a new memory: \"Adopted Milo 🐕\"",
      read: true,
      link: `/memories`,
    },
  });

  await prisma.notification.create({
    data: {
      id: uuid(),
      userId: alice.id,
      type: NotificationType.TIMELINE,
      title: "Timeline Update",
      message: "Bob added a timeline event: \"Alice Met My Parents\"",
      read: false,
      link: `/timeline`,
    },
  });

  await prisma.notification.create({
    data: {
      id: uuid(),
      userId: admin.id,
      type: NotificationType.INVITATION,
      title: "System Notification",
      message: "Welcome to the Couple Chat admin panel. You have full access.",
      read: true,
    },
  });
  console.log(`✅ Created 4 notifications`);

  // ── Invitation Codes ──────────────────────────────────────────────────────

  await prisma.coupleInvitation.create({
    data: {
      id: uuid(),
      code: "DEMO-CODE-2024",
      creatorId: alice.id,
      coupleId: couple.id,
      expiresAt: daysAgo(-30), // 30 days from now
    },
  });
  console.log(`✅ Created unused invitation code: DEMO-CODE-2024`);

  // ── Privacy Settings ──────────────────────────────────────────────────────

  await prisma.userPrivacySetting.createMany({
    data: [
      {
        id: uuid(),
        userId: alice.id,
        showOnlineStatus: true,
        showLastSeen: true,
        readReceipts: true,
      },
      {
        id: uuid(),
        userId: bob.id,
        showOnlineStatus: true,
        showLastSeen: false, // Bob hides last seen
        readReceipts: true,
      },
      {
        id: uuid(),
        userId: admin.id,
        showOnlineStatus: false,
        showLastSeen: false,
        readReceipts: false,
      },
    ],
  });
  console.log(`✅ Created privacy settings for 3 users`);

  console.log("\n🎉 Seed complete!");
  console.log("────────────────────────────────────────");
  console.log("📧 Admin:  admin@example.com  / Admin123!");
  console.log("📧 Alice:  alice@example.com  / Password123!");
  console.log("📧 Bob:    bob@example.com    / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

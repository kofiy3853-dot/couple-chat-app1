import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notification-helpers";
import type { PresenceStatus } from "@/lib/constants";
import { messageRateLimiter, typingRateLimiter, reactionRateLimiter, gameRateLimiter, connectionRateLimiter } from "./src/server/websocket/rate-limiter";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const REDIS_URL = process.env.REDIS_URL;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const corsOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (!corsOrigin) {
    if (dev) {
      console.warn("[WS] NEXT_PUBLIC_APP_URL not set in dev — allowing all origins");
    } else {
      console.error("[WS] NEXT_PUBLIC_APP_URL is not set in production — refusing to start");
      process.exit(1);
    }
  }

  const io = new SocketIOServer(httpServer, {
    path: "/api/ws",
    cors: {
      origin: corsOrigin || (dev ? "*" : undefined),
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Suppress benign Socket.IO parse errors from transport upgrades/extensions
  io.engine.on("connection_error", (err: { message: string }) => {
    if (err.message.includes("JSON")) return;
    console.error("[WS] Engine error:", err.message);
  });

  // ─── Redis adapter (optional) ──────────────────────────────────────────────
  let pubClient: Redis | null = null;
  let subClient: Redis | null = null;

  async function setupRedisAdapter() {
    if (!REDIS_URL) {
      console.log("[WS] No REDIS_URL set, using in-memory adapter");
      return;
    }
    try {
      pubClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
      subClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      pubClient.on("error", (err) => {
        console.error("[WS] Redis pub client error:", err.message);
      });
      subClient.on("error", (err) => {
        console.error("[WS] Redis sub client error:", err.message);
      });

      io.adapter(createAdapter(pubClient, subClient));
      console.log("[WS] Redis adapter connected");
    } catch (err) {
      console.error("[WS] Redis adapter failed, falling back to in-memory:", err);
      pubClient = null;
      subClient = null;
    }
  }

  // ─── Auth middleware ───────────────────────────────────────────────────────
  const socketUserData = new Map<string, { userId: string; userName: string }>();
  const membershipCache = new Map<string, { members: Set<string>; isGroup: boolean; expiry: number }>();
  const MEMBERSHIP_CACHE_TTL = 60_000; // 1 minute

  io.use(async (socket, next) => {
    try {
      // Verify JWT session token from cookies
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const isProduction = process.env.NODE_ENV === "production";
      const token = await getToken({
        req: { headers: { cookie: cookieHeader } } as unknown as Request,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
        cookieName: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      });

      if (!token?.id) {
        return next(new Error("Unauthorized: invalid session"));
      }

      const userId = token.id as string;
      const userName = (token.name as string) || userId;

      // Verify the claimed userId matches the session
      const claimedUserId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
      if (claimedUserId && claimedUserId !== userId) {
        return next(new Error("Unauthorized: user ID mismatch"));
      }

      socketUserData.set(socket.id, { userId, userName });
      next();
    } catch (err) {
      console.error("[WS] Auth error:", err);
      next(new Error("Unauthorized"));
    }
  });

  // ─── Membership check (cached) ────────────────────────────────────────────
  async function isConversationMember(userId: string, conversationId: string): Promise<{ isMember: boolean; isGroup: boolean }> {
    const cached = membershipCache.get(conversationId);
    if (cached && cached.expiry > Date.now()) {
      return { isMember: cached.members.has(userId), isGroup: cached.isGroup };
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        couple: { include: { members: { select: { userId: true } } } },
        participants: { select: { userId: true } },
      },
    });

    if (!conversation) return { isMember: false, isGroup: false };

    const members = new Set<string>();
    const isGroup = conversation.isGroup;

    if (!isGroup && conversation.couple) {
      conversation.couple.members.forEach((m: { userId: string }) => members.add(m.userId));
    } else {
      conversation.participants.forEach((p: { userId: string }) => members.add(p.userId));
    }

    membershipCache.set(conversationId, { members, isGroup, expiry: Date.now() + MEMBERSHIP_CACHE_TTL });
    return { isMember: members.has(userId), isGroup };
  }

  // ─── Presence helpers ──────────────────────────────────────────────────────
  const onlineUsers = new Map<string, Set<string>>();
  const userRooms = new Map<string, Set<string>>();
  const userPresence = new Map<string, PresenceStatus>();

  async function setOnline(userId: string) {
    try {
      if (pubClient) {
        await pubClient.set(`online:${userId}`, "1", "EX", 300);
        await pubClient.sadd("online_users", userId);
      }
    } catch (err) {
      console.error("[WS] Failed to set user online:", err);
    }
  }

  async function setOffline(userId: string) {
    try {
      if (pubClient) {
        await pubClient.del(`online:${userId}`);
        await pubClient.srem("online_users", userId);
      }
    } catch (err) {
      console.error("[WS] Failed to set user offline:", err);
    }
  }

  async function setPresenceStatus(userId: string, status: PresenceStatus) {
    userPresence.set(userId, status);
    try {
      if (pubClient) {
        await pubClient.set(`presence:${userId}`, status, "EX", 300);
      }
    } catch (err) {
      console.error("[WS] Failed to set presence status:", err);
    }
  }

  async function clearPresenceStatus(userId: string) {
    userPresence.delete(userId);
    try {
      if (pubClient) {
        await pubClient.del(`presence:${userId}`);
      }
    } catch (err) {
      console.error("[WS] Failed to clear presence status:", err);
    }
  }

  async function getFullPresenceSnapshot(): Promise<Record<string, PresenceStatus>> {
    const snapshot: Record<string, PresenceStatus> = {};
    const allUserIds = new Set<string>();
    try {
      if (pubClient) {
        const members = await pubClient.smembers("online_users");
        members.forEach((id) => allUserIds.add(id));
      } else {
        onlineUsers.forEach((_, id) => allUserIds.add(id));
      }
    } catch (err) {
      console.error("[WS] Failed to get presence snapshot:", err);
      onlineUsers.forEach((_, id) => allUserIds.add(id));
    }
    for (const uid of allUserIds) {
      snapshot[uid] = userPresence.has(uid) ? userPresence.get(uid)! : "online";
    }
    return snapshot;
  }

  // ─── Connection handling ───────────────────────────────────────────────────
  io.on("connection", async (socket) => {
    const userData = socketUserData.get(socket.id);
    if (!userData) return;
    const userId = userData.userId;
    const userName = userData.userName;

    // Connection rate limit
    const connLimit = await connectionRateLimiter(`conn:${userId}`);
    if (!connLimit.allowed) {
      console.warn(`[WS] Connection rate limit exceeded for user ${userId}`);
      socket.disconnect();
      return;
    }

    console.log(`[WS] ${userName} connected (${socket.id})`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    userRooms.set(socket.id, new Set());

    socket.join(`user:${userId}`);
    await setOnline(userId);
    await setPresenceStatus(userId, "online");
    socket.broadcast.emit("user-online", { userId, userName });

    const presenceSnapshot = await getFullPresenceSnapshot();
    socket.emit("presence-snapshot", presenceSnapshot);

    // ─── Join conversation ──────────────────────────────────────────────────
    socket.on("join-conversation", async (data: { conversationId: string }) => {
      const { conversationId } = data;
      if (!conversationId) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) {
        socket.emit("error", { message: "Not a member of this conversation" });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      userRooms.get(socket.id)?.add(conversationId);
      console.log(`[WS] ${userName} joined conversation ${conversationId}`);
    });

    // ─── Leave conversation ─────────────────────────────────────────────────
    socket.on("leave-conversation", (data: { conversationId: string }) => {
      const { conversationId } = data;
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
      userRooms.get(socket.id)?.delete(conversationId);
    });

    // ─── Send message ───────────────────────────────────────────────────────
    socket.on("send-message", async (data: { conversationId: string; content: string; type?: string; localId?: string; replyToId?: string }) => {
      const { conversationId, content, type = "TEXT", localId, replyToId } = data;
      if (!conversationId || !content) return;

      // Rate limit: 10 messages/second per user
      const msgLimit = await messageRateLimiter(`msg:${userId}`);
      if (!msgLimit.allowed) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      // Sanitize content
      const trimmed = content.trim().slice(0, 5000);
      if (trimmed.length === 0) return;

      // Validate type
      const validTypes = ["TEXT", "IMAGE", "AUDIO"];
      const msgType = validTypes.includes(type) ? type : "TEXT";

      // Validate replyToId if provided (UUID format)
      if (replyToId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(replyToId)) {
        socket.emit("error", { message: "Invalid replyToId" });
        return;
      }

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) {
        socket.emit("error", { message: "Not a member" });
        return;
      }

      try {
        const message = await db.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: trimmed,
            type: msgType as "TEXT" | "IMAGE" | "AUDIO",
            replyToId: replyToId || undefined,
          },
          include: {
            sender: { select: { id: true, name: true, username: true, image: true } },
            reactions: true,
            attachments: true,
            replyTo: {
              select: {
                id: true,
                content: true,
                type: true,
                sender: { select: { id: true, name: true, username: true } },
              },
            },
          },
        });

        await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        io.to(`conversation:${conversationId}`).emit("new-message", message);
        socket.emit("message-sent", { localId, message });

        // Create notification for partner
        try {
          const conv = await db.conversation.findUnique({
            where: { id: conversationId },
            include: { couple: { include: { members: true } } },
          });
          const partner = conv?.couple?.members.find((m) => m.userId !== userId);
          if (partner) {
            const sender = message.sender;
            const senderName = sender?.name || sender?.username || "Your partner";
            const notifCreated = await createNotification({
              userId: partner.userId,
              type: "MESSAGE",
              title: "New Message",
              message: `${senderName} sent you a message`,
              link: "/chat",
            });
            if (notifCreated) {
              const notif = await db.notification.findFirst({
                where: { userId: partner.userId, type: "MESSAGE" },
                orderBy: { createdAt: "desc" },
              });
              if (notif) {
                io.to(`user:${partner.userId}`).emit("new-notification", {
                  id: notif.id,
                  type: notif.type,
                  title: notif.title,
                  message: notif.message,
                  link: notif.link,
                  read: false,
                  createdAt: notif.createdAt.toISOString(),
                });
              }
            }
          }
        } catch (e) {
          console.error("[WS] notification error:", e);
        }
      } catch (err) {
        console.error("[WS] send-message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ─── Broadcast new message ──────────────────────────────────────────────
    // REMOVED: Clients must use REST API to persist, then server broadcasts via send-message.
    // The old handler allowed message forgery since it relayed client-supplied objects without DB persistence.

    // ─── Message delivered ──────────────────────────────────────────────────
    socket.on("message-delivered", async (data: { messageId: string; conversationId: string }) => {
      const { messageId, conversationId } = data;
      if (!messageId || !conversationId) return;
      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("message-delivered", { messageId, deliveredBy: userId });
    });

    // ─── Message read ───────────────────────────────────────────────────────
    socket.on("message-read", async (data: { conversationId: string; lastReadMessageId: string }) => {
      const { conversationId, lastReadMessageId } = data;
      if (!conversationId || !lastReadMessageId) return;
      const { isMember, isGroup } = await isConversationMember(userId, conversationId);
      if (!isMember) return;

      // Verify the message belongs to this conversation
      const msg = await db.message.findUnique({ where: { id: lastReadMessageId }, select: { conversationId: true } });
      if (!msg || msg.conversationId !== conversationId) return;

      try {
        if (isGroup) {
          await db.conversationParticipant.updateMany({
            where: { userId, conversationId },
            data: { lastReadMessageId },
          });
        } else {
          // For couple chats, scope to the couple's conversation
          const conversation = await db.conversation.findUnique({
            where: { id: conversationId },
            select: { coupleId: true },
          });
          if (conversation?.coupleId) {
            const coupleMember = await db.coupleMember.findFirst({
              where: { userId, coupleId: conversation.coupleId },
            });
            if (coupleMember) {
              await db.coupleMember.update({
                where: { id: coupleMember.id },
                data: { lastReadMessageId },
              });
            }
          }
        }
      } catch (err) {
        console.error("[WS] message-read error:", err);
      }
      io.to(`conversation:${conversationId}`).emit("messages-read", { conversationId, readBy: userId, lastReadMessageId });
    });

    // ─── Typing ─────────────────────────────────────────────────────────────
    socket.on("typing-start", async (data: { conversationId: string }) => {
      if (!data.conversationId) return;

      const typeLimit = await typingRateLimiter(`type:${userId}`);
      if (!typeLimit.allowed) return;

      const { isMember } = await isConversationMember(userId, data.conversationId);
      if (!isMember) return;
      socket.to(`conversation:${data.conversationId}`).emit("typing-start", { userId, userName, conversationId: data.conversationId });
    });

    socket.on("typing-stop", async (data: { conversationId: string }) => {
      if (!data.conversationId) return;

      const typeLimit = await typingRateLimiter(`type:${userId}`);
      if (!typeLimit.allowed) return;

      const { isMember } = await isConversationMember(userId, data.conversationId);
      if (!isMember) return;
      socket.to(`conversation:${data.conversationId}`).emit("typing-stop", { userId, conversationId: data.conversationId });
    });

    // ─── Recording ──────────────────────────────────────────────────────────
    socket.on("recording-start", async (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      const { isMember } = await isConversationMember(userId, data.conversationId);
      if (!isMember) return;
      setPresenceStatus(userId, "recording");
      socket.to(`conversation:${data.conversationId}`).emit("recording-start", { userId, conversationId: data.conversationId });
    });

    socket.on("recording-stop", async (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      const { isMember } = await isConversationMember(userId, data.conversationId);
      if (!isMember) return;
      setPresenceStatus(userId, "online");
      socket.to(`conversation:${data.conversationId}`).emit("recording-stop", { userId, conversationId: data.conversationId });
    });

    // ─── Call ───────────────────────────────────────────────────────────────
    socket.on("call-start", async (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      const { isMember } = await isConversationMember(userId, data.conversationId);
      if (!isMember) return;
      setPresenceStatus(userId, "in-call");
      socket.to(`conversation:${data.conversationId}`).emit("call-start", { userId, conversationId: data.conversationId });
    });

    socket.on("call-end", async (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      const { isMember } = await isConversationMember(userId, data.conversationId);
      if (!isMember) return;
      setPresenceStatus(userId, "online");
      socket.to(`conversation:${data.conversationId}`).emit("call-end", { userId, conversationId: data.conversationId });
    });

    // ─── Reactions ──────────────────────────────────────────────────────────
    socket.on("reaction-added", async (data: { messageId: string; conversationId: string; emoji: string }) => {
      const { messageId, conversationId, emoji } = data;
      if (!messageId || !conversationId || !emoji) return;

      const reactLimit = await reactionRateLimiter(`react:${userId}`);
      if (!reactLimit.allowed) return;

      if (emoji.length > 8 || [...emoji].length !== 1) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("reaction-added", { messageId, userId, userName, emoji });
    });

    socket.on("reaction-removed", async (data: { messageId: string; conversationId: string; emoji: string }) => {
      const { messageId, conversationId, emoji } = data;
      if (!messageId || !conversationId || !emoji) return;

      const reactLimit = await reactionRateLimiter(`react:${userId}`);
      if (!reactLimit.allowed) return;

      if (emoji.length > 8 || [...emoji].length !== 1) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("reaction-removed", { messageId, userId, emoji });
    });

    // ─── Message edited ─────────────────────────────────────────────────────
    socket.on("message-edited", async (data: { messageId: string; conversationId: string; content: string }) => {
      const { messageId, conversationId, content } = data;
      if (!messageId || !conversationId) return;
      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      // Verify the user owns this message
      const msg = await db.message.findUnique({ where: { id: messageId }, select: { senderId: true } });
      if (!msg || msg.senderId !== userId) return;
      io.to(`conversation:${conversationId}`).emit("message-edited", { messageId, content, editedBy: userId });
    });

    // ─── Delete message ─────────────────────────────────────────────────────
    socket.on("message-deleted", async (data: { messageId: string; conversationId: string }) => {
      const { messageId, conversationId } = data;
      if (!messageId || !conversationId) return;
      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      // Verify the user owns this message
      const msg = await db.message.findUnique({ where: { id: messageId }, select: { senderId: true } });
      if (!msg || msg.senderId !== userId) return;
      io.to(`conversation:${conversationId}`).emit("message-deleted", { messageId, deletedBy: userId });
    });

    // ─── Game events ────────────────────────────────────────────────────────
    socket.on("game-start", async (data: { conversationId: string; game: string; payload?: unknown }) => {
      const { conversationId, game } = data;
      if (!conversationId || !game) return;

      const gameLimit = await gameRateLimiter(`game:${userId}`);
      if (!gameLimit.allowed) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("game-challenge-received", { fromUserId: userId, fromUserName: userName, game, type: data.payload });
    });

    socket.on("game-choice", async (data: { conversationId: string; game: string; payload: unknown }) => {
      const { conversationId, game, payload } = data;
      if (!conversationId || !game) return;

      const gameLimit = await gameRateLimiter(`game:${userId}`);
      if (!gameLimit.allowed) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("game-choice-made", { fromUserId: userId, fromUserName: userName, game, payload });
    });

    socket.on("game-question", async (data: { conversationId: string; game: string; question: string; payload?: unknown }) => {
      const { conversationId, game, question } = data;
      if (!conversationId || !question) return;

      const gameLimit = await gameRateLimiter(`game:${userId}`);
      if (!gameLimit.allowed) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("game-question-received", { fromUserId: userId, fromUserName: userName, game, question, type: data.payload });
    });

    socket.on("game-answer", async (data: { conversationId: string; game: string; completed: boolean; payload?: unknown }) => {
      const { conversationId, completed, game } = data;
      if (!conversationId) return;

      const gameLimit = await gameRateLimiter(`game:${userId}`);
      if (!gameLimit.allowed) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("game-answer-result", { fromUserId: userId, fromUserName: userName, game, completed, payload: data.payload });
    });

    socket.on("game-end", async (data: { conversationId: string; game: string }) => {
      const { conversationId, game } = data;
      if (!conversationId) return;

      const gameLimit = await gameRateLimiter(`game:${userId}`);
      if (!gameLimit.allowed) return;

      const { isMember } = await isConversationMember(userId, conversationId);
      if (!isMember) return;
      io.to(`conversation:${conversationId}`).emit("game-ended", { fromUserId: userId, game });
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", async (reason) => {
      console.log(`[WS] ${userName} disconnected (${socket.id}): ${reason}`);
      socketUserData.delete(socket.id);
      const sockets = onlineUsers.get(userId);
      if (!sockets) {
        userRooms.delete(socket.id);
        return;
      }

      const remaining = sockets.size - 1;
      sockets.delete(socket.id);

      if (remaining <= 0) {
        onlineUsers.delete(userId);
        await clearPresenceStatus(userId);
        await setOffline(userId);
        socket.broadcast.emit("user-offline", { userId });
      }
      userRooms.delete(socket.id);
    });
  });

  // ─── Start ────────────────────────────────────────────────────────────────
  setupRedisAdapter().then(() => {
    httpServer.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  });
});

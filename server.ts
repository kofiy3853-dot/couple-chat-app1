import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { db } from "@/lib/db";
import type { PresenceStatus } from "@/lib/constants";

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

  const io = new SocketIOServer(httpServer, {
    path: "/api/ws",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
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
      pubClient = new Redis(REDIS_URL);
      subClient = new Redis(REDIS_URL);
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

  io.use(async (socket, next) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (!userId || typeof userId !== "string") {
      return next(new Error("User ID required"));
    }
    const dbUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    if (!dbUser) {
      return next(new Error("User not found"));
    }
    socketUserData.set(socket.id, { userId, userName: dbUser.name || userId });
    next();
  });

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
    } catch {}
  }

  async function setOffline(userId: string) {
    try {
      if (pubClient) {
        await pubClient.del(`online:${userId}`);
        await pubClient.srem("online_users", userId);
      }
    } catch {}
  }

  async function setPresenceStatus(userId: string, status: PresenceStatus) {
    userPresence.set(userId, status);
    try {
      if (pubClient) {
        await pubClient.set(`presence:${userId}`, status, "EX", 300);
      }
    } catch {}
  }

  async function clearPresenceStatus(userId: string) {
    userPresence.delete(userId);
    try {
      if (pubClient) {
        await pubClient.del(`presence:${userId}`);
      }
    } catch {}
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
    } catch {
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

      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          couple: { include: { members: { select: { userId: true } } } },
          participants: { select: { userId: true } },
        },
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      const isCoupleConversation = !conversation.isGroup;
      let isMember = false;
      if (isCoupleConversation && conversation.couple) {
        isMember = conversation.couple.members.some((m: { userId: string }) => m.userId === userId);
      } else {
        isMember = conversation.participants.some((p: { userId: string }) => p.userId === userId);
      }

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
    socket.on("send-message", async (data: { conversationId: string; content: string; type?: string; localId?: string }) => {
      const { conversationId, content, type = "TEXT", localId } = data;
      if (!conversationId || !content) return;

      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          couple: { include: { members: { select: { userId: true } } } },
          participants: { select: { userId: true } },
        },
      });

      if (!conversation) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      const isCoupleConversation = !conversation.isGroup;
      let isMember = false;
      if (isCoupleConversation && conversation.couple) {
        isMember = conversation.couple.members.some((m: { userId: string }) => m.userId === userId);
      } else {
        isMember = conversation.participants.some((p: { userId: string }) => p.userId === userId);
      }

      if (!isMember) {
        socket.emit("error", { message: "Not a member" });
        return;
      }

      try {
        const message = await db.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            type: type as "TEXT" | "IMAGE" | "AUDIO",
          },
          include: {
            sender: { select: { id: true, name: true, image: true } },
            reactions: true,
            attachments: true,
          },
        });

        await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        io.to(`conversation:${conversationId}`).emit("new-message", message);
        socket.emit("message-sent", { localId, message });
      } catch (err) {
        console.error("[WS] send-message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ─── Broadcast new message ──────────────────────────────────────────────
    socket.on("broadcast-new-message", (data: { conversationId?: string; message?: { conversationId?: string } }) => {
      const message = data?.message;
      const conversationId = data?.conversationId || message?.conversationId;
      if (!conversationId || !message) return;
      socket.to(`conversation:${conversationId}`).emit("new-message", message);
    });

    // ─── Message delivered ──────────────────────────────────────────────────
    socket.on("message-delivered", (data: { messageId: string; conversationId: string }) => {
      const { messageId, conversationId } = data;
      if (!messageId || !conversationId) return;
      io.to(`conversation:${conversationId}`).emit("message-delivered", { messageId, deliveredBy: userId });
    });

    // ─── Message read ───────────────────────────────────────────────────────
    socket.on("message-read", async (data: { conversationId: string; lastReadMessageId: string }) => {
      const { conversationId, lastReadMessageId } = data;
      if (!conversationId || !lastReadMessageId) return;
      try {
        await db.coupleMember.updateMany({ where: { userId }, data: { lastReadMessageId } });
      } catch (err) {
        console.error("[WS] message-read error:", err);
      }
      io.to(`conversation:${conversationId}`).emit("messages-read", { conversationId, readBy: userId, lastReadMessageId });
    });

    // ─── Typing ─────────────────────────────────────────────────────────────
    socket.on("typing-start", (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      socket.to(`conversation:${data.conversationId}`).emit("typing-start", { userId, userName, conversationId: data.conversationId });
    });

    socket.on("typing-stop", (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      socket.to(`conversation:${data.conversationId}`).emit("typing-stop", { userId, conversationId: data.conversationId });
    });

    // ─── Recording ──────────────────────────────────────────────────────────
    socket.on("recording-start", (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      setPresenceStatus(userId, "recording");
      socket.to(`conversation:${data.conversationId}`).emit("recording-start", { userId, conversationId: data.conversationId });
    });

    socket.on("recording-stop", (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      setPresenceStatus(userId, "online");
      socket.to(`conversation:${data.conversationId}`).emit("recording-stop", { userId, conversationId: data.conversationId });
    });

    // ─── Call ───────────────────────────────────────────────────────────────
    socket.on("call-start", (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      setPresenceStatus(userId, "in-call");
      socket.to(`conversation:${data.conversationId}`).emit("call-start", { userId, conversationId: data.conversationId });
    });

    socket.on("call-end", (data: { conversationId: string }) => {
      if (!data.conversationId) return;
      setPresenceStatus(userId, "online");
      socket.to(`conversation:${data.conversationId}`).emit("call-end", { userId, conversationId: data.conversationId });
    });

    // ─── Reactions ──────────────────────────────────────────────────────────
    socket.on("reaction-added", (data: { messageId: string; conversationId: string; emoji: string }) => {
      const { messageId, conversationId, emoji } = data;
      if (!messageId || !conversationId || !emoji) return;
      io.to(`conversation:${conversationId}`).emit("reaction-added", { messageId, userId, userName, emoji });
    });

    socket.on("reaction-removed", (data: { messageId: string; conversationId: string; emoji: string }) => {
      const { messageId, conversationId, emoji } = data;
      if (!messageId || !conversationId || !emoji) return;
      io.to(`conversation:${conversationId}`).emit("reaction-removed", { messageId, userId, emoji });
    });

    // ─── Message edited ─────────────────────────────────────────────────────
    socket.on("message-edited", (data: { messageId: string; conversationId: string; content: string }) => {
      const { messageId, conversationId, content } = data;
      if (!messageId || !conversationId) return;
      io.to(`conversation:${conversationId}`).emit("message-edited", { messageId, content, editedBy: userId });
    });

    // ─── Delete message ─────────────────────────────────────────────────────
    socket.on("message-deleted", (data: { messageId: string; conversationId: string }) => {
      const { messageId, conversationId } = data;
      if (!messageId || !conversationId) return;
      io.to(`conversation:${conversationId}`).emit("message-deleted", { messageId, deletedBy: userId });
    });

    // ─── Game events ────────────────────────────────────────────────────────
    socket.on("game-start", (data: { conversationId: string; type: "truth" | "dare" }) => {
      const { conversationId, type } = data;
      if (!conversationId || !type) return;
      io.to(`conversation:${conversationId}`).emit("game-challenge-received", { fromUserId: userId, fromUserName: userName, type });
    });

    socket.on("game-choice", (data: { conversationId: string; type: "truth" | "dare" }) => {
      const { conversationId, type } = data;
      if (!conversationId || !type) return;
      io.to(`conversation:${conversationId}`).emit("game-choice-made", { fromUserId: userId, fromUserName: userName, type });
    });

    socket.on("game-question", (data: { conversationId: string; question: string; type: "truth" | "dare" }) => {
      const { conversationId, question, type } = data;
      if (!conversationId || !question) return;
      io.to(`conversation:${conversationId}`).emit("game-question-received", { fromUserId: userId, fromUserName: userName, question, type });
    });

    socket.on("game-answer", (data: { conversationId: string; completed: boolean }) => {
      const { conversationId, completed } = data;
      if (!conversationId) return;
      io.to(`conversation:${conversationId}`).emit("game-answer-result", { fromUserId: userId, fromUserName: userName, completed });
    });

    socket.on("game-end", (data: { conversationId: string }) => {
      const { conversationId } = data;
      if (!conversationId) return;
      io.to(`conversation:${conversationId}`).emit("game-ended", { fromUserId: userId });
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", async (reason) => {
      console.log(`[WS] ${userName} disconnected (${socket.id}): ${reason}`);
      socketUserData.delete(socket.id);
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          await clearPresenceStatus(userId);
          setOffline(userId);
          socket.broadcast.emit("user-offline", { userId });
        }
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

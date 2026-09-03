import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { db } from "@/lib/db";
import type { PresenceStatus } from "@/lib/constants";

// Render passes the PORT environment variable dynamically for Web Services
const PORT = parseInt(process.env.PORT || process.env.WS_PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL;

const httpServer: HttpServer = new HttpServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Couple Chat WebSocket Server is running.");
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Redis adapter (optional) ────────────────────────────────────────────────
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

async function setupRedisAdapter() {
  if (!REDIS_URL) {
    console.log("[WS] No REDIS_URL set, using in-memory adapter");
    return false;
  }
  try {
    pubClient = new Redis(REDIS_URL);
    subClient = new Redis(REDIS_URL);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("[WS] Redis adapter connected");
    return true;
  } catch (err) {
    console.error("[WS] Redis adapter failed, falling back to in-memory:", err);
    pubClient = null;
    subClient = null;
    return false;
  }
}

// ─── Demo auth middleware (simple userId from client) ──────────────────────────
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

io.use(async (socket: AuthenticatedSocket, next) => {
  const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
  if (!userId || typeof userId !== "string") {
    return next(new Error("User ID required"));
  }

  // Verify user exists in DB
  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!dbUser) {
    return next(new Error("User not found"));
  }

  socket.userId = userId;
  socket.userName = dbUser.name || userId;
  next();
});

// ─── Online presence helpers ─────────────────────────────────────────────────
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>
const userRooms = new Map<string, Set<string>>();   // socketId -> Set<conversationId>
const userPresence = new Map<string, PresenceStatus>(); // userId -> status

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

async function getPresenceStatus(userId: string): Promise<PresenceStatus> {
  if (userPresence.has(userId)) return userPresence.get(userId)!;
  try {
    if (pubClient) {
      const status = await pubClient.get(`presence:${userId}`);
      if (status && ["online", "typing", "recording", "in-call"].includes(status)) {
        return status as PresenceStatus;
      }
    }
  } catch {}
  return "offline";
}

async function getFullPresenceSnapshot(): Promise<Record<string, PresenceStatus>> {
  const snapshot: Record<string, PresenceStatus> = {};
  const allUserIds = new Set<string>();

  // Collect all known user IDs from online users
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

  // Build presence snapshot
  for (const uid of allUserIds) {
    if (userPresence.has(uid)) {
      snapshot[uid] = userPresence.get(uid)!;
    } else {
      snapshot[uid] = "online";
    }
  }
  return snapshot;
}

// ─── Connection handling ─────────────────────────────────────────────────────
io.on("connection", async (socket: AuthenticatedSocket) => {
  const userId = socket.userId!;
  const userName = socket.userName!;

  console.log(`[WS] ${userName} connected (${socket.id})`);

  // Track socket in online users
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socket.id);
  userRooms.set(socket.id, new Set());

  // Join personal room
  socket.join(`user:${userId}`);

  // Mark online & broadcast
  await setOnline(userId);
  await setPresenceStatus(userId, "online");
  socket.broadcast.emit("user-online", { userId, userName });

  // Send full presence snapshot to the newly connected client
  const presenceSnapshot = await getFullPresenceSnapshot();
  socket.emit("presence-snapshot", presenceSnapshot);

  // ─── Join conversation ──────────────────────────────────────────────────
  socket.on("join-conversation", async (data: { conversationId: string }) => {
    const { conversationId } = data;
    if (!conversationId) return;

    // Verify user is member of this conversation (couple OR group)
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
    console.log(`[WS] ${userName} left conversation ${conversationId}`);
  });

  // ─── Send message ───────────────────────────────────────────────────────
  socket.on("send-message", async (data: { conversationId: string; content: string; type?: "TEXT" | "IMAGE"; localId?: string }) => {
    const { conversationId, content, type = "TEXT", localId } = data;
    if (!conversationId || !content) return;

    // Verify membership (couple OR group)
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
          type: type as "TEXT" | "IMAGE",
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          reactions: true,
          attachments: true,
        },
      });

      // Update conversation timestamp
      await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

      // Broadcast to conversation room
      io.to(`conversation:${conversationId}`).emit("new-message", message);

      // Also emit to sender personally for optimistic update resolution
      socket.emit("message-sent", { localId, message });
    } catch (err) {
      console.error("[WS] send-message error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ─── Broadcast new message (after REST save) ────────────────────────────
  socket.on("broadcast-new-message", (data: { conversationId: string; message: any }) => {
    const { conversationId, message } = data;
    if (!conversationId || !message) return;
    socket.to(`conversation:${conversationId}`).emit("new-message", message);
  });

  // ─── Message delivered ──────────────────────────────────────────────────
  socket.on("message-delivered", (data: { messageId: string; conversationId: string }) => {
    const { messageId, conversationId } = data;
    if (!messageId || !conversationId) return;
    io.to(`conversation:${conversationId}`).emit("message-delivered", {
      messageId,
      deliveredBy: userId,
    });
  });

  // ─── Message read ───────────────────────────────────────────────────────
  socket.on("message-read", async (data: { conversationId: string; lastReadMessageId: string }) => {
    const { conversationId, lastReadMessageId } = data;
    if (!conversationId || !lastReadMessageId) return;

    // Save to database
    try {
      await db.coupleMember.updateMany({
        where: { userId },
        data: { lastReadMessageId },
      });
    } catch (err) {
      console.error("[WS] message-read error:", err);
    }

    io.to(`conversation:${conversationId}`).emit("messages-read", {
      conversationId,
      readBy: userId,
      lastReadMessageId,
    });
  });

  // ─── Typing ─────────────────────────────────────────────────────────────
  socket.on("typing-start", (data: { conversationId: string }) => {
    if (!data.conversationId) return;
    socket.to(`conversation:${data.conversationId}`).emit("typing-start", {
      userId,
      userName,
      conversationId: data.conversationId,
    });
  });

  socket.on("typing-stop", (data: { conversationId: string }) => {
    if (!data.conversationId) return;
    socket.to(`conversation:${data.conversationId}`).emit("typing-stop", {
      userId,
      conversationId: data.conversationId,
    });
  });

  // ─── Recording ──────────────────────────────────────────────────────────
  socket.on("recording-start", (data: { conversationId: string }) => {
    if (!data.conversationId) return;
    setPresenceStatus(userId, "recording");
    socket.to(`conversation:${data.conversationId}`).emit("recording-start", {
      userId,
      conversationId: data.conversationId,
    });
  });

  socket.on("recording-stop", (data: { conversationId: string }) => {
    if (!data.conversationId) return;
    setPresenceStatus(userId, "online");
    socket.to(`conversation:${data.conversationId}`).emit("recording-stop", {
      userId,
      conversationId: data.conversationId,
    });
  });

  // ─── Call ───────────────────────────────────────────────────────────────
  socket.on("call-start", (data: { conversationId: string }) => {
    if (!data.conversationId) return;
    setPresenceStatus(userId, "in-call");
    socket.to(`conversation:${data.conversationId}`).emit("call-start", {
      userId,
      conversationId: data.conversationId,
    });
  });

  socket.on("call-end", (data: { conversationId: string }) => {
    if (!data.conversationId) return;
    setPresenceStatus(userId, "online");
    socket.to(`conversation:${data.conversationId}`).emit("call-end", {
      userId,
      conversationId: data.conversationId,
    });
  });

  // ─── Reactions ──────────────────────────────────────────────────────────
  socket.on("reaction-added", (data: { messageId: string; conversationId: string; emoji: string }) => {
    const { messageId, conversationId, emoji } = data;
    if (!messageId || !conversationId || !emoji) return;
    io.to(`conversation:${conversationId}`).emit("reaction-added", {
      messageId,
      userId,
      userName,
      emoji,
    });
  });

  socket.on("reaction-removed", (data: { messageId: string; conversationId: string; emoji: string }) => {
    const { messageId, conversationId, emoji } = data;
    if (!messageId || !conversationId || !emoji) return;
    io.to(`conversation:${conversationId}`).emit("reaction-removed", {
      messageId,
      userId,
      emoji,
    });
  });

  // ─── Message edited ─────────────────────────────────────────────────────
  socket.on("message-edited", (data: { messageId: string; conversationId: string; content: string }) => {
    const { messageId, conversationId, content } = data;
    if (!messageId || !conversationId) return;
    io.to(`conversation:${conversationId}`).emit("message-edited", {
      messageId,
      content,
      editedBy: userId,
    });
  });

  // ─── Delete message ─────────────────────────────────────────────────────
  socket.on("message-deleted", (data: { messageId: string; conversationId: string }) => {
    const { messageId, conversationId } = data;
    if (!messageId || !conversationId) return;
    io.to(`conversation:${conversationId}`).emit("message-deleted", {
      messageId,
      deletedBy: userId,
    });
  });

  // ─── Game: Truth or Dare ────────────────────────────────────────────────
  // Player 1 starts game, sends choice to Player 2
  socket.on("game-start", (data: { conversationId: string; type: "truth" | "dare" }) => {
    const { conversationId, type } = data;
    if (!conversationId || !type) return;
    io.to(`conversation:${conversationId}`).emit("game-challenge-received", {
      fromUserId: userId,
      fromUserName: userName,
      type,
    });
  });

  // Player 2 responds with their choice
  socket.on("game-choice", (data: { conversationId: string; type: "truth" | "dare" }) => {
    const { conversationId, type } = data;
    if (!conversationId || !type) return;
    io.to(`conversation:${conversationId}`).emit("game-choice-made", {
      fromUserId: userId,
      fromUserName: userName,
      type,
    });
  });

  // Player 1 sends the specific question/dare to Player 2
  socket.on("game-question", (data: { conversationId: string; question: string; type: "truth" | "dare" }) => {
    const { conversationId, question, type } = data;
    if (!conversationId || !question) return;
    io.to(`conversation:${conversationId}`).emit("game-question-received", {
      fromUserId: userId,
      fromUserName: userName,
      question,
      type,
    });
  });

  // Player 2 completes or skips the challenge
  socket.on("game-answer", (data: { conversationId: string; completed: boolean }) => {
    const { conversationId, completed } = data;
    if (!conversationId) return;
    io.to(`conversation:${conversationId}`).emit("game-answer-result", {
      fromUserId: userId,
      fromUserName: userName,
      completed,
    });
  });

  // Either player ends the game
  socket.on("game-end", (data: { conversationId: string }) => {
    const { conversationId } = data;
    if (!conversationId) return;
    io.to(`conversation:${conversationId}`).emit("game-ended", {
      fromUserId: userId,
    });
  });

  // ─── Disconnect ─────────────────────────────────────────────────────────
  socket.on("disconnect", async (reason) => {
    console.log(`[WS] ${userName} disconnected (${socket.id}): ${reason}`);

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

// ─── Start server ────────────────────────────────────────────────────────────
async function start() {
  await setupRedisAdapter();
  // Bind explicitly to 0.0.0.0 for Render/Docker compatibility
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[WS] WebSocket server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[WS] Failed to start:", err);
  process.exit(1);
});
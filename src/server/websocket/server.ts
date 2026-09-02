import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "";
const REDIS_URL = process.env.REDIS_URL;

const httpServer: HttpServer = new HttpServer();

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

// ─── Auth middleware ──────────────────────────────────────────────────────────
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

async function verifyToken(token: string): Promise<{ id: string; email: string; name?: string } | null> {
  try {
    if (!JWT_SECRET) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub?: string;
      id?: string;
      email?: string;
      name?: string;
    };
    const userId = decoded.sub || decoded.id;
    if (!userId || !decoded.email) return null;
    return { id: userId, email: decoded.email, name: decoded.name };
  } catch {
    return null;
  }
}

io.use(async (socket: AuthenticatedSocket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token || typeof token !== "string") {
    return next(new Error("Authentication required"));
  }

  const user = await verifyToken(token);
  if (!user) {
    return next(new Error("Invalid or expired token"));
  }

  // Verify user exists in DB
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, status: true } });
  if (!dbUser || dbUser.status !== "ACTIVE") {
    return next(new Error("User not found or suspended"));
  }

  socket.userId = user.id;
  socket.userName = dbUser.name || user.email;
  next();
});

// ─── Online presence helpers ─────────────────────────────────────────────────
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>
const userRooms = new Map<string, Set<string>>();   // socketId -> Set<conversationId>

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

// ─── Connection handling ─────────────────────────────────────────────────────
io.on("connection", (socket: AuthenticatedSocket) => {
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
  setOnline(userId);
  socket.broadcast.emit("user-online", { userId, userName });

  // ─── Join conversation ──────────────────────────────────────────────────
  socket.on("join-conversation", async (data: { conversationId: string }) => {
    const { conversationId } = data;
    if (!conversationId) return;

    // Verify user is member of this conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { couple: { include: { members: { select: { userId: true } } } } },
    });

    if (!conversation) {
      socket.emit("error", { message: "Conversation not found" });
      return;
    }

    const isMember = conversation.couple.members.some((m: { userId: string }) => m.userId === userId);
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

    // Verify membership
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { couple: { include: { members: { select: { userId: true } } } } },
    });

    if (!conversation) {
      socket.emit("error", { message: "Conversation not found" });
      return;
    }

    const isMember = conversation.couple.members.some((m: { userId: string }) => m.userId === userId);
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
  socket.on("message-read", (data: { conversationId: string; lastReadMessageId: string }) => {
    const { conversationId, lastReadMessageId } = data;
    if (!conversationId || !lastReadMessageId) return;
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

  // ─── Delete message ─────────────────────────────────────────────────────
  socket.on("message-deleted", (data: { messageId: string; conversationId: string }) => {
    const { messageId, conversationId } = data;
    if (!messageId || !conversationId) return;
    io.to(`conversation:${conversationId}`).emit("message-deleted", {
      messageId,
      deletedBy: userId,
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
  httpServer.listen(PORT, () => {
    console.log(`[WS] WebSocket server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[WS] Failed to start:", err);
  process.exit(1);
});

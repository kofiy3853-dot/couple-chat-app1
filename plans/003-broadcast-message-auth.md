# 003 — Add Conversation Membership Check to broadcast-new-message WS Handler

Finding: HIGH (Security)
Effort: S
Risk of fix: Low
Confidence: High
Commit against: `ea0dcaf`

## Why this matters

The handler at `server.ts` line ~293 ("Broadcast new message (after REST save)") has ZERO authorization checks — it skips the conversation membership verification that every other write-path in the file (join-conversation, send-message) performs. A maliciously-crafted client can emit:
```js
socket.emit("broadcast-new-message", {
  conversationId: "<target couple conversation id>",
  message: { id: "x", senderId: "victim-id", content: "spoofed content" }
});
```
Every user socket in `conversation:<id> room will render this message locally via addRealtimeMessage. It appears to come from the victim. It vanishes on page refresh (never wrote to DB), but the deception window is real harm.

## Files in scope
- `src/server/websocket/server.ts` → the `broadcast-new-message` handler (~ lines 292-298)
- `src/lib/conversation-utils.ts` → import and reuse `assertConversationMember` helper

**Out of scope:** REST API routes; client code (no client changes needed).

## Current state

```ts
socket.on("broadcast-new-message", (data: { conversationId?: string; message?: any }) => {
  const message = data?.message;
  const conversationId = data?.conversationId || message?.conversationId;
  if (!conversationId || !message) return;
  socket.to(`conversation:${conversationId}`).emit("new-message", message);
});
```

## Plan

### Step 1 — Add two checks before emit:

1. **Sender (socket.userId) MUST match message.senderId — you can only broadcast on behalf of yourself only, not spoof sender
2. **Sender MUST be a member of the conversation (call assertConversationMember or inline the check)

Inlined with the existing pattern used at send-message above it for consistency — or just add:

```ts
socket.on("broadcast-new-message", async (data: { conversationId?: string; message?: any }) => {
  const message = data?.message;
  const conversationId = data?.conversationId || message?.conversationId;
  if (!conversationId || !message) return;

  // 1. Anti-spoof: sender in message must match the authenticated socket user
  if (message.senderId !== userId) return;

  try {
    // 2. Verify membership exactly as send-message does
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        couple: { include: { members: { select: { userId: true } } } },
        participants: { select: { userId: true } },
      },
    });
    if (!conversation) return;

    const isCoupleConversation = !conversation.isGroup;
    let isMember = false;
    if (isCoupleConversation && conversation.couple) {
      isMember = conversation.couple.members.some((m: { userId: string }) => m.userId === userId);
    } else {
      isMember = conversation.participants.some((p: { userId: string }) => p.userId === userId);
    }
    if (!isMember) return;

    socket.to(`conversation:${conversationId}`).emit("new-message", message);
  } catch {
    // swallow DB errors; just don't emit
  }
});
```

Alternatively: use `assertConversationMember(conversationId, userId)` from `@/lib/conversation-utils.ts` — it does the same query + throws typed errors. This is cleaner. Import it at the top of server.ts (it already uses `db` the same pattern:

Check that the tsconfig path aliases work for the standalone WS server tsx process. Path aliases often don't work for tsx without node:-) If tsconfig has paths set up for `@/*` → the tsx file: if path alias is fine. If the import fails runtime, fall back to relative path: `../../lib/conversation-utils`. Before writing code, test quickly: if server.ts currently uses path aliases? Check:

Current file imports:
```
import { db } from "@/lib/db";
import type { PresenceStatus } from "@/lib/constants";
```
Yes! `@/` aliases are working. So import `assertConversationMember`.

So the concise version:
```ts
socket.on("broadcast-new-message", async (data: { conversationId?: string; message?: any }) => {
  const message = data?.message;
  const conversationId = data?.conversationId || message?.conversationId;
  if (!conversationId || !message) return;
  if (message.senderId !== userId) return;
  try {
    await assertConversationMember(conversationId, userId);
    socket.to(`conversation:${conversationId}`).emit("new-message", message);
  } catch {
    // not a member → do nothing
  }
});
```

Add to server.ts top import:
```ts
import { assertConversationMember } from "@/lib/conversation-utils";
```

### Step 2 — Done criteria

```
npx tsc --noEmit → 0 errors
npm run lint → clean
WS server boots clean boots → startup
```

Manual sanity: log a non-member user broadcasts → no broadcast emits. Logged-in couple chat continues to work normally (REST sends broadcast from Alice → Bob receives message in real time.

### Maintenance note

Every new WS broadcast-write event handler pattern to conversation rooms must include this same assertConversationMember guard. Consider centralizing this into a decorator/wrapper helper to prevent future copy-paste omissions. Finding #12 of the audit noted this duplication across 8+ handlers. That is a separate plan.

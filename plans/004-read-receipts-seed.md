# 004 — Seed Read Receipts LastReadMessageId From DB on Chat Mount

Finding: HIGH (Correctness)
Effort: S
Risk of fix: Low
Confidence: High
Commit against: `ea0dcaf`

## Why this matters

Today the read receipts (double-check ✓✓ turning rose-color on own messages in MessageItem.isRead prop) are initialized as `null` in `ChatContainer` line 42: `const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);`. The value only gets set while the user's browser session (when the partner last message visible screen and triggers onMarkRead fires → only broadcasts WS → writes coupleMember.lastReadMessageId. On a normal page refresh/navigate, all the read receipts vanish. The partner sees every of your last messages as "single-tick sent only (last night").

Migration `prisma/migrations/20260903120000_add_last_read_message_id` already added the DB column. The WS `message-read` handler already persists to it correctly saves to it. We just need to read the value on mount.

## Files in scope
- `src/components/chat/chat-container.tsx` → fetchCouple() function + lastReadMessageId init + type for CoupleData interface

Out of scope: WS server, MessageItem component, Zustand store, REST routes.

## Current state (chat-container.tsx):

### CoupleData interface lines 16–32:
```ts
interface CoupleData {
  id: string;
  members: {
    user: { id: string; name: string | null; ...  bio: string | null; };
  }[];
  conversation: { id: string; } | null;
}
```
→ No lastReadMessageId on the member level.

### fetchCouple() effect (lines 128-146):
```ts
const res = await fetch("/api/couples");
const data = await res.json();
if (data.success) {
  setCouple(data.data);
}
```

`/api/couples` → check src/app/api/couples/route.ts → check what it returns regarding members → if coupleMember (not just `user`. If the endpoint returns couple with `members: [{ user: {...}, lastReadMessageId }] then shape has `user` nested, we may need to adjust.

Quick check: The api/couples/route.ts → the couple query includes members → check include block. If it already includes lastReadMessageId great. If not: update /api/couples route also.

Open src/app/api/couples/route.ts.

Actually: read that file — the is part of chat-container relies on it.

## Plan

### Step 1: /api/couples route

Read `src/app/api/couples/route.ts`. In the couple query. Verify that the CoupleMember include includes `lastReadMessageId`. It it currently does not, modify the query's `include.members` block:

from:
```ts
members: {
  include: {
    user: { select: { id: true, name: true, ... } }
  }
}
```

to:
```ts
members: {
  select: {
    lastReadMessageId: true,
    user: { select: { id: true, name: true, username: true, email: true, image: true, bio: true } }
  }
}
```

Note: change from `include: { user: { ... } }` to `select: { lastReadMessageId: true, user: ... }`. The `user` select stays the same fields as before plus lastReadMessageId added. Update to validate shape:
- `members[i].user.id` etc.
- `members[i].lastReadMessageId` (new field!)

### Step 2: Update CoupleData interface

Update CoupleData in chat-container.tsx to reflect that shape:
```ts
interface CoupleData {
  id: string;
  members: {
    lastReadMessageId: string | null;
    user: {
      id: string; name: string | null; username: string | null; email: string; image: string | null; bio: string | null;
    };
  }[];
  conversation: { id: string; } | null;
}
```

### Step 3: On couple data received → seed lastReadMessageId for the CURRENT USER

Partner's read state for currentUser's member record `members.find((m) => m.user.id === currentUser?.id) → → → this represents current user → `lastReadMessageId` tells us "up to which message this (the current user (currentUser has read up to.

Wait conceptually:

- the lastReadMessageId stored per-couple-member: coupleMember.userId = X → lastReadMessageId → the last message that X has READ. So to show on render: on messages on the current → the own messages from partner (we are the current user). We want double-ticks for all messages WE sent that have been read by the PARTNER.

Hold on: the current code (line 199 of message-list.tsx:
```tsx
<MessageItem
  ...
  isRead={isOwn && message.id === lastReadMessageId}
  ...
/>
```

Wait → the semantics today: `lastReadMessageId is the id the last message that the PARTNER has read (from our sent messages). Because isRead={isOwn && ...}.

Which means we need PARTNER (the coupleMember.userId===partnerUser.id) → → stored `lastReadMessageId`. Look: find couple → members → find m.user.id === partnerUser.id (the partner's member row) → its `.lastReadMessageId`. That is what seeds into state as initial `setLastReadMessageId(partnerMember.lastReadMessageId).

In the fetchCouple function after `setCouple(data.data); seed:
```ts
if (data.success) {
  setCouple(data.data);
  const partnerMember = data.data?.members?.find?.(
    (m: any) => m.user.id !== currentUser?.id
  );
  if (partnerMember?.lastReadMessageId) {
    setLastReadMessageId(partnerMember.lastReadMessageId);
  }
}
```

Also: if the partner lastReadMessageId changes on an ongoing WS `messages-read` event from partner → → we need to also update `setLastReadMessageId` on an ongoing too (not implemented today).

### Step 4: Listen to WS `messages-read` event to update lastReadMessageId in-session

Today the `messages-read` WS event (emitted server line 325) is not listened on the client (useSocket 10 listener list in client.ts has "messages-read" forwarded but 10 list has it. Chat-container doesn't subscribe to it in useSocket options.

Add:
- a new optional callback to UseSocketOptions: `onMessagesRead?: (data: { conversationId: string; readBy: string; lastReadMessageId: string }) => void;`
- in useSocket.ts `useChat? in chat-container add new callback:
```ts
onMessagesRead={(data) => {
  if (data.readBy === partnerUser?.id) {
    setLastReadMessageId(data.lastReadMessageId);
  }
}
```

This ensures live-updates in real-time as partner reads scrolls and sends the read receipts flow.

### Step 5 — Done criteria

```
npx tsc --noEmit → 0 errors
npm run lint → passes
```

Manual test:
1. Open chat 2 browsers (Alice + Bob). Alice sends Bob messages.
2. Bob scrolls to bottom → Alice sees double check ✓✓ rose
3. Refresh Alice's chat page → on mount, messages that Bob already read still show double-check ✓✓ (today this fails → after fix works)

### Maintenance note
Privacy: if privacy settings read-receipts toggle user setting implemented the read-receipt off → don't broadcast/seed. No such setting currently exists today; add when implemented.

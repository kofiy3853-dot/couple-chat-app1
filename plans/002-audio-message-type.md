# 002 — Fix AUDIO Message Type Persisted as TEXT

**Finding:** HIGH (Correctness)
Effort: S
Risk of fix: Low
Confidence: High
Commit against: `ea0dcaf`

## Why this matters

When a user records and sends a voice note via `MessageInput` (voice-note-player), the client correctly sends `type: "AUDIO"` in the POST body to `/api/messages`. But the POST handler silently coerces the type to only `"IMAGE"` or `"TEXT"`. Voice notes end up stored in `prisma with `type: TEXT`. This works visually today only because `MessageItem` renders attachments by checking `attachments.length > 0` and looks at mimeType, not by message type. But:
- Future queries filtering `where: { type: "AUDIO" }` will return zero results
- Analytics, export, audio-only search features are broken
- The redundant WS `send-message` handler has the same bug (not currently used but will bite if wired)

## Files in scope

- `src/app/api/messages/route.ts` POST handler (~line 151-158 create block)
- `src/server/websocket/server.ts` `send-message` handler (~line 263-270 create block)
- `src/lib/validation.ts` messageSchema — OPTIONAL: add `type` enum field to schema for the Zod validation if desired (read current 002 step 2)

**Out of scope: all other files, schema, migrations (column type already supports enum with AUDIO. The Prisma schema already includes AUDIO — verify first by checking prisma/schema.prisma Message.type enum).

## Current state

### messages/route.ts POST, lines ~151-158:
```ts
const message = await db.message.create({
  data: {
    conversationId,
    senderId: user.id,
    content: parsed.data.content,
    type: (type === "IMAGE" ? "IMAGE" : "TEXT") as "TEXT" | "IMAGE",
    replyToId,
  },
```

### server.ts send-message handler, lines ~263-270:
```ts
const message = await db.message.create({
  data: {
    conversationId,
    senderId: userId,
    content,
    type: type as "TEXT" | "IMAGE",
  },
```

### messageSchema (validation.ts, lines 41-47):
```ts
export const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  replyToId: z.string().uuid().optional(),
});
```
Notice `type` is NOT validated even though it's sent from client.

## Plan

### Step 1 — Fix the REST POST handler type coercion

Replace `(type === "IMAGE" ? "IMAGE" : "TEXT")` with a proper 3-way check:

```ts
const messageType: "TEXT" | "IMAGE" | "AUDIO" =
  type === "IMAGE" ? "IMAGE" :
  type === "AUDIO" ? "AUDIO" : "TEXT";
```

Then use it:
```ts
type: messageType,
```

Put a type-level check: ensure the resulting create call passes TypeScript compilation (`type is a Message type enum from Prisma). If TS complains that the Prisma enum is not compatible, cast explicitly: cast from `as any` or import the actual enum from `@prisma/client`.

Import style: the project imports `@prisma/client` already (import { db } from "@/lib/db"; the Prisma generate — the Prisma client types). If there is re-use the types.

### Step 2 — Fix the WS send-message handler same coercion

In server.ts send-message handler:
Same 3-way check for `type === "AUDIO ? "AUDIO"` before falling back to TEXT.

### Step 3 — Add type to Zod validation (bonus but recommended)

Add a `type` field to `messageSchema` in lib/validation.ts:

```ts
export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message must be at most 5000 characters"),
  type: z.enum(["TEXT", "IMAGE", "AUDIO"]).default("TEXT").optional(),
  replyToId: z.string().uuid("Invalid replyToId").optional(),
});
```

Then in messages/route.ts POST, use `parsed.data.type` instead of destructured unvalidated `type` from the raw `body`. Replace body `body` as type extraction. So:

```ts
// OLD: const { conversationId, content, type } = body as { conversationId: string; content: string; type?: string };
// change → delete that destructure; then:
const parsed already has type via parsed.data.type. conversationId still needs its own check (not in schema)
```

Keep conversationId validation as-is (it's NOT part of the path param conceptually — the schema is the shared message shape; conversationId stays separate. Or add conversationId (uuid) to schema too. That's a reasonable improvement minor. Either way. Keep the plan.

### Step 4 — Done criteria

```
npx tsc --noEmit → 0 errors
npm run lint → 0 warnings
npx vitest run → passes (the validation tests exist; add a new case to the validation.test.ts optional but not required — no change the executor skip)
```

Send a voice note via UI → inspect the prisma `message.type` in DB via `npx prisma studio`:
```
SELECT id, type FROM "Message" ORDER BY "createdAt" DESC LIMIT 1;
```
→ type column value is `AUDIO`.

### Maintenance note

Future message types (e.g. VIDEO, FILE) must update 3 places: (1) prisma enum, (2) zod schema type enum, (3) this coercion. Update all three together.

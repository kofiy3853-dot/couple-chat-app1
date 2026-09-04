# 005 — Validate Edit-Message PATCH Through Zod Schema + Consistent Error Shape

Finding: HIGH (Security / Correctness)
Effort: S
Risk of fix: Low
Confidence: High
Commit against: `ea0dcaf`

## Why this matters

The PATCH handler `src/app/api/messages/[messageId]/route.ts` for edit-messages currently validates content with a loose truthy string check, not the project's shared `messageSchema` Zod validator (which enforces `max(5000)` character length). An attacker can edit a message to a huge string, bypassing the 5000-char limit that applies to the create endpoint. Also throws a generic Error instead of typed ValidationError → inconsistent error response shape across the API client.

## Files in scope

- `src/app/api/messages/[messageId]/route.ts` PATCH handler (~ lines 42-82)
- `src/lib/validation.ts` — optional: add a dedicated edit-message schema (reuse or new) or reuse the existing shared message type.

Out of scope: DELETE handler in the same file. REST routes. WebSocket server.

## Current state (PATCH lines ~42-82):

```ts
const { content } = body;
if (!content || typeof content !== "string" || !content.trim()) {
  throw new Error("Content is required and must be a non-empty");
}
```

## Plan

### Step 1 — Define a Zod schema (or reuse messageSchema.content)

Option A — in `lib/validation.ts`:

Define a reusable schema for the same rules at a content portion of editing is the same limits. A editMessageSchema:

```ts
export const editMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message must be at most 5000 characters"),
});
```
Reuse the exact same `export type EditMessageInput = z.infer<typeof editMessageSchema>;

Option B (simpler): Just messageSchema already has the right content size, and replyToId we ignore the other fields (we don't need them on edit).

Good: Option A is cleaner and explicit, so go with A.

Add to src/lib/validation.ts → editMessageSchema definition with min/max same content.

### Step 2 — Apply validation in [messageId]/route.ts PATCH:

Replace the body block old ad-hoc content check with Zod safeParse:

```ts
import { editMessageSchema } from "@/lib/validation";
import { ValidationError } from "@/lib/errors";

// inside PATCH:
const body = await request.json();
const parsed = editMessageSchema.safeParse(body);
if (!parsed.success) {
  const fieldErrors: Record<string, string[]> = {};
  parsed.error.issues.forEach((err) => {
    const field = err.path.join(".");
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(err.message);
  });
  return errorResponse(
    new ValidationError("Validation failed", fieldErrors)
  );
}
const content = parsed.data.content.trim();
```

Keep all existing logic for: fetch message, check sender matches current user, check deleted message not deleted, then update.

Also: today the update call updates with `content: content.trim()` → we already trimmed via zod's `.trim()) to schema → keep trim, zod also .trim(); Zod .min(1) catches whitespace-only inputs after the (if use z.string().trim() adds a .trim() at the zod schema too):
```ts
content: z.string().trim().min(1).max(5000)
```
→ then `content` is already trimmed → parsed.data.content, no need for extra `.trim()` in the handler). Choose whichever matches the create-schema pattern the project already uses in messageSchema (check: messageSchema doesn't .trim()) — just min(1). So don't add trim() to schema (avoid changing the style — just `.min/max → keep consistency) → keep consistent. Then in handler: content.trim() used.

handler code→ use handler → content = parsed.data.content.

### Step 3 — Done criteria

```
npx tsc --noEmit → 0 errors
npm run lint → passes
npx vitest run existing 0 if executor should test — add a new case to validation.test.ts for editMessageSchema if desired: optional)
```

Manual test attempt:
- Edit a message to 6000 chars long payload. → the payload 5000 OK rejected with validation error & 400 response shape matches POST create errors (the error fieldErrors structure `{ success: false, error: { message, code: "VALIDATION_ERROR", errors: { content:[ "..."]}}}` matches GET /messages POST message creation behavior.

### Maintenance note

Any future content size limit changes (new limits apply the message schema) update both messageSchema & editMessageSchema together at the same time to prevent drift.

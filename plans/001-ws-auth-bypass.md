# 001 — Fix WebSocket Authentication Bypass

**Finding: CRITICAL (Security)
Effort: M
Risk of fix: Medium
Confidence: High
Commit against: `ea0dcaf`

## Why this matters

The Socket.io middleware in `src/server/websocket/server.ts` accepts a plain `userId` string from the client (`handshake.auth.userId` or query param, then verifies only that such a user exists in the database. There is no session signature, cookie, or JWT verification. Any client who knows another user's UUID string can fully impersonate them: join their conversations, read their presence, and emit events on their behalf.

## Files in scope

- `src/server/websocket/server.ts` — the `io.use(...)` auth middleware block (~ lines 62–77)
- `src/server/websocket/client.ts` — the connect() call (~ line 57–63) — how the WS auth payload
- `src/hooks/use-socket.ts` — how useSocket instantiates the WS client with userId
- `src/lib/auth.config.ts` — existing JWT session decode logic (reference only, do not modify)
- `src/app/api/ws/route.ts` — check how socket.io ingress under Next's /api/ws (if used; reference only)

**Files explicitly OUT of scope:
- REST API routes (they already use `requireAuth()` correctly
- Prisma schema / migrations (no schema changes)

## Current state (excerpts for the executor must match against

### `src/server/websocket/server.ts` current middleware:
```ts
io.use(async (socket: AuthenticatedSocket, next) => {
  const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
  if (!userId || typeof userId !== "string") {
    return next(new Error("User ID required"));
  }
  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  // ... sets socket.userId / socket.userName
});
```

### `src/server/websocket/client.ts` connect():
```ts
this.socket = io(this.url, {
  path: "/api/ws",
  transports: ["websocket", "polling"],
  reconnection: false,
  timeout: 10000,
  auth: { userId: this.userId },
});
```

### Existing JWT mechanism (reference, do NOT modify):
Session strategy is JWT (`auth.config.ts` line 5: `session: { strategy: "jwt" }`). Next-Auth v5 beta (`next-auth@5.0.0-beta.32). The JWT token contains `id`, `username`, `role` claims (see `auth.config.ts` callbacks). Cookie name is Next-Auth default: `next-auth.session-token` (or `__Secure-next-auth.session-token` in HTTPS).

## The session JWT is signed by Next-Auth using `NEXTAUTH_SECRET`

## Plan

### Step 1 — Decide the correct approach: re-use Next-Auth JWT, not pass raw userId

The WS client must stop sending plain userId. Instead, the WS server must:
1. Accept either: read the Next-Auth session-token cookie from the socket handshake (preferred for same-origin). It cookie is available on socket handshake in `socket.request.headers.cookie`)
2. OR: have client reads+verifies the JWT signature using `NEXTAUTH_SECRET`, extracting `id` claim
3. Use that `id` as socket.userId. If JWT invalid/missing → reject connection.

### Step 2 — Add JWT decode utility in server.ts

Install `jose` is NOT a current dep; instead use `@auth/core` JWT helpers (available via next-auth v5 which is already installed):

```
Actually: next-auth v5 beta exports `decode()` from `@auth/core/jwt` — check; if unavailable, fall back to importing `decode` package or directly via:
```ts
import { decode } from "@auth/core/jwt";
```
(or `import { jwt } from "next-auth/jwt"` — check what next-auth beta exposes; if neither, install nothing — instead just parse cookie → the simplest robust way is: `next-auth/jwt` which exists in v5.)

Check first, import whatever Next-Auth v5 beta exports for JWT decoding, then in the middleware:

```ts
import { cookies } from "next/headers"; // only if run inside Next edge/node — the WS server is a standalone tsx server, so use cookie parsing instead.

// In standalone TS server — read cookie via socket.request.headers.cookie string.
```

Add a helper function in server.ts:
```ts
async function getUserIdFromHandshake(socket: Socket): Promise<string | null> {
  const cookieHeader = socket.handshake.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...rest] = c.trim().split("=");
      return [k, decodeURIComponent(rest.join("="))];
    })
  );
  const token = cookies["next-auth.session-token"] || cookies["__Secure-next-auth.session-token"];
  if (!token) return null;

  try {
    // Use Next-Auth's decode() to verify the JWT against NEXTAUTH_SECRET
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET!,
      salt: process.env.NEXTAUTH_SALT ??
       (process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    });
    return (decoded?.id as string) || null;
  } catch {
    return null;
  }
}
```

If `decode` from next-auth beta is not a direct export, fallback to the `jose` approach: install is part of Next-Auth's tree — do NOT install a new dep; instead, use the `jose` that ships with next-auth v5 already (check node_modules/jose). If jose:
```ts
import * as jose from "jose";
async function verify(token: string, secret: string) {
  const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
  return payload;
}
```

Either approach is acceptable — choose whichever works without adding a new dep. When in doubt: read the auth.config.ts JWT salt algorithm: Next-Auth v5 JWT uses A256GCM by default — so `jose.jwtDecrypt` + direct decrypt payload.id. The key is derived: secret is NEXTAUTH_SECRET, and salt defaults as per next-auth defaults.

### Step 3 — Replace io.use middleware

In server.ts `io.use`:

Replace the userId-from-client block with:

```ts
io.use(async (socket: AuthenticatedSocket, next) => {
  const userId = await getUserIdFromHandshake(socket);
  if (!userId) {
    return next(new Error("Authentication required"));
  }
  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!dbUser) {
    return next(new Error("User not found"));
  }
  socket.userId = userId;
  socket.userName = dbUser.name || userId;
  next();
});
```

**Crucially:** Remove the `socket.handshake.auth?.userId` and `socket.handshake.query?.userId` accept paths entirely. The userId MUST come solely from the verified cookie → JWT, never from client-supplied data.

### Step 4 — Update WebSocket client to stop sending userId in auth

In `src/server/websocket/client.ts` constructor and connect():
- Remove `auth: { userId: this.userId }` from the io() options.
- Remove the `this.userId` instance field if it's now solely use leave it; leave userId passed to getInstance() — keep the instance still needs to know userId for local decisions reconnect logic).
- The actual authentication now comes from the cookie the browser automatically sends with every WebSocket upgrade; no client-side changes needed for the handshake at all.

Crucially:** The singleton getInstance() may still need userId for reconnect/user tracking. Keep options.userId but do NOT use auth:{} in the server trust it only for client-internal bookkeeping (and destroy-and-recreate logic on user switch).

In connect():
```ts
this.socket = io(this.url, {
  path: "/api/ws",
  transports: ["websocket", "polling"],
  reconnection: false,
  timeout: 10000,
  // auth: { } REMOVED — no longer send userId
  withCredentials: true, // ensures cookie is sent on upgrade
});
```

### Step 5 — Optional fallback: if the WS server runs on a different port/origin than the Next app (3000 vs 3001 typically) the cookie may be on same host but different port — cookie's Domain/Path/SameSite matter. Ensure that:

- The cookie is available on the upgrade request. For Render deployments where NEXT_PUBLIC_APP_URL and WS_URL share same top-level domain, this works with SameSite=Lax (default for Next-Auth session cookies). For local dev, localhost:3000 sets cookie that goes to localhost:3001 WS upgrade — same host, different port → cookie is sent.

Verify by checking dev tools Network tab WS upgrade handshake request → Request Headers should include `Cookie:` header.

If it's missing (rare edge case), fall back to step 1 alternative: send JWT via auth.token: { token: <jwt> } in client, THEN decode on the server. But prefer the cookie path first; the cookie is the correct mechanism.

### Step 6 — Tests

- Existing `npx vitest run` passes.
- `npx tsc --noEmit` clean.
- Manually: start the Next app (npm run dev) → open chat in browser with logged-in user → should connect to WS → presence shows.
- Manually: try a second incognito window, not logged in → should NOT be able to connect to WS if manually constructing a socket connection to localhost:PORT/api/ws with { auth: { userId: "<some-uuid>" } } — connection rejected.

### Done criteria
```
npx tsc --noEmit → 0 errors
npm run lint → 0 errors
npx vitest run → all pass
WS server boots (npx tsx src/server/websocket/server.ts) → no startup errors
Logged-out user cannot authenticate by sending a raw userId in auth or query
```

### Maintenance note
Future Next-Auth upgrades may change JWT cookie name/salt conventions. The cookie-name literals ("next-auth.session-token", "__Secure-next-auth.session-token") may need updating if Next-Auth changes them. If we ever switch to a DB session strategy this entire mechanism must switch to DB-session lookup instead of JWT decode.

### Escape hatch: if Next-Auth JWT decode is not importable or too tangled in v5 beta

If the `decode`/jose the Next-Auth JWT uses A256GCM encryption (not a sig) we just do the straightforward JWS), use this plan's exact:
- jose.jwtDecrypt(token, new TextEncoder().encode(process.env.NEXTAUTH_SECRET), {
    keyManagementAlgorithms: ["dir"],
    contentEncryptionAlgorithms: ["A256GCM"],
  })
  → this option. If this does not work immediately with this NEXT-AUTH v5 beta, use the following: STUB:
  (the NEXT-AUTH v5 beta use custom JWT helpers export

If truly stuck, fall back to issuing the WS the simpler transport that call `GET /api/auth/session` the the the server from the WS server process (server-to-server call on every handshake) to validate cookie header — that works but is slower. Try that ONLY as a last resort.

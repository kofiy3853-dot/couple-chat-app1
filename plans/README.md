# Chat Page Audit — Implementation Plans

Generated against commit: `ea0dcaf` (2026-09-04)`

These plans fix the top 5 findings from the `/improve standard-depth chat-page audit. Each plan is self-contained — an executor with no context can follow it cold.

## Verification Commands (run between every plan)

```
# Typecheck
npx tsc --noEmit

# Lint
npm run lint

# Existing tests
npx vitest run
```

If a plan modifies the WebSocket server code (`src/server/websocket/`), also start it separately to ensure it boots:
```
npx tsx src/server/websocket/server.ts
# Ctrl+C after "WebSocket server running on port..."
```

---

## Execution Order & Dependencies

| Priority | # | Plan | Status | Notes |
|---|---|---|---|---|
| 1 | 001 | [Fix WebSocket authentication bypass | PENDING | Foundational security. Must land before exposing WS to untrusted clients. No dependency on others. |
| 2 | 002 | Fix AUDIO message type persisted as TEXT | PENDING | Independent S-size data-correctness fix. Parallel-safe with 001/003. |
| 3 | 003 | Add auth check to broadcast-new-message WS handler | PENDING | Independent S-size security fix. Parallel-safe with 001/002. |
| 4 | 004 | Seed read receipts from DB on chat page mount | PENDING | Independent S-size correctness fix. Can run anytime after 001. |
| 5 | 005 | Validate edit-message PATCH through Zod schema | PENDING | Independent S-size fix. Parallel-safe with all others. |

## Dependency Graph (DAG):

```
001 (WS auth) ─┐
002 (AUDIO type) ─┤
003 (broadcast auth) ─┼─── all safe to ship in any order or parallel
004 (read receipts) ─┤
005 (edit validation) ─┘
```

004 depends on an existing couple-members column (`lastReadMessageId` added in migration `20260903120000_add_last_read_message_id`). It is already present — no new migration needed.

## Finding Index of Remaining Audit Findings (not yet planned)

Planned if requested later:

- 06: Reaction broadcast uses stale-state race (MEDIUM correctness)
- 07: Infinite scroll jump (MEDIUM perf/UX)
- 08: MessageItem memo comparator missing reaction diff (MEDIUM correctness/perf)
- 09: Attachments endpoint verify sender ownership (MEDIUM security)
- 10: groupMessagesByDate not memoized (MEDIUM perf)
- 11: Redis presence key not cleared on disconnect (MEDIUM correctness)
- 12: Duplicated WS send-message path (MEDIUM architecture)
- 13: lastSeen always null (LOW UX)
- 14: Native confirm() dialog for clear history (LOW UX)
- 15: Duplicate getInitials util (LOW tech debt)
- 16: Copy-text for non-text messages errors silently (LOW UX)
- 17: Add chat test coverage (HIGH risk exposure, L effort)

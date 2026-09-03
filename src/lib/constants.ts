// ─── Roles ───────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

// ─── User Status ─────────────────────────────────────────────────────────────
export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
} as const;

// ─── Bcrypt ──────────────────────────────────────────────────────────────────
export const BCRYPT_SALT_ROUNDS = 12;

// ─── Pagination ──────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// ─── File Upload ─────────────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── WebSocket ───────────────────────────────────────────────────────────────
export const WS_RECONNECT_MAX_ATTEMPTS = 10;
export const WS_RECONNECT_MAX_DELAY = 30000;
export const WS_CONNECTION_TIMEOUT = 10000;
export const WS_PRESENCE_TTL = 300; // 5 minutes in seconds

// ─── Chat ────────────────────────────────────────────────────────────────────
export const MESSAGE_FETCH_LIMIT = 50;
export const CHAT_POLL_INTERVAL = 3000; // 3 seconds

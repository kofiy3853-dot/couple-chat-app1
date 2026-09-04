import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be at most 500 characters")
    .optional(),
  image: z.string().url("Invalid image URL").optional(),
});

export const messageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID").optional(),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be at most 5000 characters"),
  type: z.enum(["TEXT", "IMAGE", "AUDIO"]).default("TEXT"),
  replyToId: z.string().uuid("Invalid replyToId").optional(),
});

export const memorySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  date: z.coerce.date().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

export const timelineSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  date: z.coerce.date({ message: "Date is required" }),
});

export const reportSchema = z.object({
  targetType: z.enum(["USER", "MESSAGE", "IMAGE"]),
  targetId: z.string().uuid("Invalid target ID"),
  reason: z.enum([
    "HARASSMENT",
    "SPAM",
    "INAPPROPRIATE_CONTENT",
    "IMPERSONATION",
    "OTHER",
  ]),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be at most 1000 characters"),
});

export const invitationSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 characters")
    .regex(/^[A-Z0-9]+$/, "Code must be alphanumeric"),
});

export const coupleSchema = z.object({});

export const privacySchema = z.object({
  showOnlineStatus: z.boolean(),
  showLastSeen: z.boolean(),
  readReceipts: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type MemoryInput = z.infer<typeof memorySchema>;
export type TimelineInput = z.infer<typeof timelineSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type CoupleInput = z.infer<typeof coupleSchema>;
export type PrivacyInput = z.infer<typeof privacySchema>;

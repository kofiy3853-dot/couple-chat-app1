"use client";

import { create } from "zustand";

interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface MessageSender {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "TEXT" | "IMAGE";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: MessageSender;
  reactions: MessageReaction[];
  attachments: { id: string; url: string; filename: string; mimeType: string; size: number }[];
}

interface ChatState {
  messages: Message[];
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
  setOnlineUser: (userId: string, isOnline: boolean) => void;
  setOnlineUsers: (userIds: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingUsers: new Set(),
  onlineUsers: new Set(),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    }),
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m
      ),
    })),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, deletedAt: new Date().toISOString() }
          : m
      ),
    })),
  setTypingUser: (userId, isTyping) =>
    set((state) => {
      const newTyping = new Set(state.typingUsers);
      if (isTyping) newTyping.add(userId);
      else newTyping.delete(userId);
      return { typingUsers: newTyping };
    }),
  setOnlineUser: (userId, isOnline) =>
    set((state) => {
      const newOnline = new Set(state.onlineUsers);
      if (isOnline) newOnline.add(userId);
      else newOnline.delete(userId);
      return { onlineUsers: newOnline };
    }),
  setOnlineUsers: (userIds) =>
    set({ onlineUsers: new Set(userIds) }),
}));

export type { Message, MessageReaction, MessageSender };

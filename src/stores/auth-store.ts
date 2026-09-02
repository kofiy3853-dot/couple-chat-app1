"use client";

import { create } from "zustand";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  setUser: (user: User | null) => void;
  setStatus: (status: "loading" | "authenticated" | "unauthenticated") => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  logout: () => set({ user: null, status: "unauthenticated" }),
}));

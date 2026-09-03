"use client";

import { create } from "zustand";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
}

interface DemoUserState {
  currentUser: User;
  partner: User | null;
  setPartner: (partner: User | null) => void;
}

// Fixed UUIDs matching the seed
const NAOMI_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MICKY_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

export const useDemoUserStore = create<DemoUserState>((set) => ({
  currentUser: {
    id: NAOMI_ID,
    name: "Naomi",
    username: "naomi",
    email: "naomi@example.com",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naomi",
  },
  partner: null,
  setPartner: (partner) => set({ partner }),
}));
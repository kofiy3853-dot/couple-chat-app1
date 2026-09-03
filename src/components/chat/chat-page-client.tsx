"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ChatContainer } from "@/components/chat/chat-container";
import { GroupChatSidebar } from "@/components/chat/group-chat-sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatPageClient() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar toggle button (mobile) */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute top-3 left-3 z-20 lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700"
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <PanelLeftOpen className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "shrink-0 transition-all duration-200 overflow-hidden",
          sidebarOpen ? "w-72" : "w-0"
        )}
      >
        {currentUserId && (
          <GroupChatSidebar
            currentUserId={currentUserId}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              // On mobile, close sidebar after selecting
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
          />
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <ChatContainer
          className="h-full"
          overrideConversationId={activeConversationId}
        />
      </div>
    </div>
  );
}

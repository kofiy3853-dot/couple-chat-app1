import { redirect } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";

export default async function ChatPage() {
  // Demo mode - use fixed UUID for Naomi
  const currentUserId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  // Generate a simple token for WebSocket (userId only)
  const wsToken = "";

  return (
    <div className="h-[calc(100vh-theme(spacing.32))] lg:h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-6 lg:-m-8">
      <ChatContainer
        currentUserId={currentUserId}
        token={wsToken}
      />
    </div>
  );
}
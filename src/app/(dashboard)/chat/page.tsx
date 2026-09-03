import { ChatPageClient } from "@/components/chat/chat-page-client";

export default async function ChatPage() {
  return (
    <div className="h-full overflow-hidden">
      <ChatPageClient />
    </div>
  );
}
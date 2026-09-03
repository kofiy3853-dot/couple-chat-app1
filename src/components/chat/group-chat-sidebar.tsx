"use client";

import { useState, useEffect } from "react";
import { Users, Plus, MessageCircle, Search, X, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

interface ConversationUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface ConversationItem {
  id: string;
  name?: string | null;
  isGroup: boolean;
  members: ConversationUser[];
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender: { id: string; name: string | null; username: string | null };
  } | null;
  createdAt: string;
}

interface GroupChatSidebarProps {
  currentUserId: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  className?: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLastMessageTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function GroupChatSidebar({
  currentUserId,
  activeConversationId,
  onSelectConversation,
  className,
}: GroupChatSidebarProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const filtered = conversations.filter((c) => {
    const label =
      c.isGroup
        ? c.name ?? "Group"
        : c.members.find((m) => m.id !== currentUserId)?.name ?? "Partner";
    return label.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-rose-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Chats</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          title="New group chat"
        >
          <Plus className="h-4 w-4 text-rose-500" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-full outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center p-2 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-xs">
            <MessageCircle className="h-6 w-6 mb-2 opacity-40" />
            <span>No chats found</span>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const partner = conv.members.find((m) => m.id !== currentUserId);
            const label = conv.isGroup ? conv.name ?? "Group" : partner?.name ?? partner?.username ?? "Partner";
            const lastMsg = conv.lastMessage;
            const previewText = !lastMsg
              ? "No messages yet"
              : lastMsg.type === "IMAGE"
              ? "📷 Image"
              : lastMsg.content.length > 40
              ? lastMsg.content.slice(0, 40) + "..."
              : lastMsg.content;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-900",
                  isActive && "bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {conv.isGroup ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={partner?.image ?? undefined} />
                      <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                        {getInitials(partner?.name ?? null)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-rose-700 dark:text-rose-300" : "text-gray-800 dark:text-gray-100"
                      )}
                    >
                      {label}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                        {formatLastMessageTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{previewText}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <CreateGroupModal
          currentUserId={currentUserId}
          onClose={() => setShowCreate(false)}
          onCreated={(conv) => {
            setConversations((prev) => [conv, ...prev]);
            onSelectConversation(conv.id);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────

interface CreateGroupModalProps {
  currentUserId: string;
  onClose: () => void;
  onCreated: (conv: ConversationItem) => void;
}

function CreateGroupModal({ currentUserId, onClose, onCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ConversationUser[]>([]);
  const [selected, setSelected] = useState<ConversationUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!userSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userSearch)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(
            (data.data as ConversationUser[]).filter(
              (u) => u.id !== currentUserId && !selected.some((s) => s.id === u.id)
            )
          );
        }
      } catch {
        // no-op
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [userSearch, currentUserId, selected]);

  const toggleUser = (user: ConversationUser) => {
    setSelected((prev) =>
      prev.some((s) => s.id === user.id)
        ? prev.filter((s) => s.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) { setError("Group name is required"); return; }
    if (selected.length === 0) { setError("Select at least one participant"); return; }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, participantIds: selected.map((u) => u.id) }),
      });
      const data = await res.json();
      if (data.success) {
        onCreated({
          ...data.data,
          isGroup: true,
          members: data.data.participants?.map((p: { user: ConversationUser }) => p.user) ?? [],
          lastMessage: null,
        });
      } else {
        setError(data.error || "Failed to create group");
      }
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100">New Group Chat</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Group name */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wide">
              Group Name
            </label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Game Night Squad"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800 transition-all"
            />
          </div>

          {/* Add participants */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wide">
              Add People
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800 transition-all"
              />
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { toggleUser(u); setUserSearch(""); setSearchResults([]); }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={u.image ?? undefined} />
                      <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{u.name}</p>
                      {u.username && <p className="text-[10px] text-gray-400">@{u.username}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searching && <p className="text-xs text-gray-400 mt-1 text-center">Searching…</p>}
          </div>

          {/* Selected participants */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs font-medium px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800 transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/40"
                >
                  <Check className="h-3 w-3" />
                  {u.name ?? u.username}
                  <X className="h-3 w-3 ml-0.5" />
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !groupName.trim() || selected.length === 0}
              className="flex-1 py-2 text-sm rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating…" : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Camera,
  Calendar,
  ArrowRight,
  Loader2,
  Sparkles,
  Clock,
  Users,
  Star,
  Gift,
  Map,
  Flame,
  CalendarDays,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateCoupleDialog } from "./create-couple-dialog";
import { JoinCoupleDialog } from "./join-couple-dialog";
import Link from "next/link";
import { format, differenceInDays, addYears, isPast, isToday } from "date-fns";

interface CoupleData {
  id: string;
  anniversaryDate: string | null;
  createdAt: string;
  members: {
    userId: string;
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      email: string;
    };
  }[];
  conversation: { id: string } | null;
  _count?: {
    messages?: number;
    memories?: number;
  };
  messageCount?: number;
  memoryCount?: number;
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

function getDaysTogetherFromDate(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function getNextAnniversary(dateStr: string) {
  const anniv = new Date(dateStr);
  const today = new Date();
  let next = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
  if (isPast(next) && !isToday(next)) next = addYears(next, 1);
  return next;
}

// ─────────────────────────────────────────────
// NO COUPLE — Onboarding View
// ─────────────────────────────────────────────
function NoCoupleScreen({
  onCreateOpen,
  onJoinOpen,
}: {
  onCreateOpen: () => void;
  onJoinOpen: () => void;
}) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center space-y-10 animate-fade-in">
        {/* Hero Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-2xl shadow-rose-200">
              <Heart className="h-14 w-14 text-white" fill="currentColor" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Find your{" "}
            <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              person
            </span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-md mx-auto">
            Connect with your partner and start sharing memories, messages, and
            milestones — all in one beautiful space.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Create */}
          <button
            onClick={onCreateOpen}
            className="group relative overflow-hidden rounded-2xl border-2 border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-6 text-left transition-all duration-300 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-100 hover:-translate-y-1 active:translate-y-0"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 rounded-full opacity-50 -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Create a Couple
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Start your space and invite your partner with a unique code.
              </p>
              <div className="flex items-center gap-1 mt-4 text-rose-500 font-semibold text-sm">
                Get started
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Join */}
          <button
            onClick={onJoinOpen}
            className="group relative overflow-hidden rounded-2xl border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-purple-50 p-6 text-left transition-all duration-300 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-100 hover:-translate-y-1 active:translate-y-0"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-100 rounded-full opacity-50 -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-pink-200 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Join a Couple
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Have a code from your partner? Enter it here to connect.
              </p>
              <div className="flex items-center gap-1 mt-4 text-pink-500 font-semibold text-sm">
                Enter code
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-6 text-left shadow-sm">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            How it works
          </h3>
          <div className="space-y-4">
            {[
              {
                icon: Heart,
                color: "rose",
                title: "One person creates the couple",
                desc: "They get a unique 6-character invite code.",
              },
              {
                icon: Star,
                color: "amber",
                title: "Share the code",
                desc: "Send it to your partner via text or share button.",
              },
              {
                icon: Sparkles,
                color: "purple",
                title: "Connect & celebrate",
                desc: "Once joined, your shared space is live instantly.",
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                    ${step.color === "rose" ? "bg-rose-100 text-rose-600" : ""}
                    ${step.color === "amber" ? "bg-amber-100 text-amber-600" : ""}
                    ${step.color === "purple" ? "bg-purple-100 text-purple-600" : ""}
                  `}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONNECTED — Couple Dashboard
// ─────────────────────────────────────────────
function ConnectedDashboard({
  couple,
  currentUserId,
}: {
  couple: CoupleData;
  currentUserId: string | null;
}) {
  const partner = couple.members.find((m) => m.user.id !== currentUserId)?.user;
  const me = couple.members.find((m) => m.user.id === currentUserId);

  const anniversaryDate = couple.anniversaryDate;
  const joinDate = me?.joinedAt ?? couple.createdAt;
  const daysTogether = anniversaryDate
    ? getDaysTogetherFromDate(anniversaryDate)
    : getDaysTogetherFromDate(joinDate);

  const nextAnniv = anniversaryDate ? getNextAnniversary(anniversaryDate) : null;
  const daysUntil = nextAnniv ? differenceInDays(nextAnniv, new Date()) : null;
  const isAnnivToday = daysUntil === 0;

  const messageCount = couple.messageCount ?? 0;
  const memoryCount = couple.memoryCount ?? 0;

  const quickActions = [
    {
      icon: MessageCircle,
      label: "View memories",
      sub: "Capture moments",
      href: "/memories",
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-200",
    },
    {
      icon: Camera,
      label: "Add a memory",
      sub: "Capture moments",
      href: "/memories",
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-200",
    },
    {
      icon: CalendarDays,
      label: "Timeline",
      sub: "Your journey",
      href: "/timeline",
      gradient: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-200",
    },
    {
      icon: Gift,
      label: "Settings",
      sub: "Couple settings",
      href: "/settings",
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-200",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero Banner ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-6 sm:p-8 text-white shadow-2xl shadow-rose-200">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left — couple info */}
          <div className="flex items-center gap-4">
            {/* Avatar stack */}
            <div className="flex -space-x-3">
              <div className="w-14 h-14 rounded-full border-3 border-white/40 bg-white/20 flex items-center justify-center text-lg font-bold shadow-xl ring-2 ring-white/20">
                {getInitials(me?.user.name ?? null)}
              </div>
              <div className="relative w-14 h-14 rounded-full border-3 border-white/40 overflow-hidden shadow-xl ring-2 ring-white/20">
                {partner?.image ? (
                  <img
                    src={partner.image}
                    alt={partner.name ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {getInitials(partner?.name ?? null)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-0.5">
                Your Couple
              </p>
              <h1 className="text-xl font-bold">
                {me?.user.name?.split(" ")[0] ?? "You"} &amp;{" "}
                {partner?.name?.split(" ")[0] ?? "Partner"}
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-white/80 text-sm">
                <Flame className="h-3.5 w-3.5 text-yellow-300" />
                <span>
                  {daysTogether.toLocaleString()}{" "}
                  {daysTogether === 1 ? "day" : "days"} together
                </span>
              </div>
            </div>
          </div>

          {/* Right — anniversary countdown */}
          <div className="sm:text-right">
            {anniversaryDate && nextAnniv ? (
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                {isAnnivToday ? (
                  <>
                    <p className="text-yellow-200 text-xs font-semibold uppercase tracking-wider">
                      🎉 Today!
                    </p>
                    <p className="text-white font-bold text-lg">
                      Happy Anniversary!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-0.5">
                      Next anniversary
                    </p>
                    <p className="text-white font-bold text-2xl">
                      {daysUntil}{" "}
                      <span className="text-base font-medium text-white/80">
                        days
                      </span>
                    </p>
                    <p className="text-white/60 text-xs">
                      {format(nextAnniv, "MMMM d")}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <Link href="/settings">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                  <p className="text-white/60 text-xs font-medium mb-1">
                    Anniversary date
                  </p>
                  <p className="text-white text-sm font-semibold">
                    Set a date →
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            icon: MessageCircle,
            value: messageCount.toLocaleString(),
            label: "Messages",
            color: "rose",
          },
          {
            icon: Camera,
            value: memoryCount.toLocaleString(),
            label: "Memories",
            color: "violet",
          },
          {
            icon: Calendar,
            value: daysTogether.toLocaleString(),
            label: "Days",
            color: "amber",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3
              ${stat.color === "rose" ? "bg-rose-50" : ""}
              ${stat.color === "violet" ? "bg-violet-50" : ""}
              ${stat.color === "amber" ? "bg-amber-50" : ""}
            `}
            >
              <stat.icon
                className={`h-4.5 w-4.5
                ${stat.color === "rose" ? "text-rose-500" : ""}
                ${stat.color === "violet" ? "text-violet-500" : ""}
                ${stat.color === "amber" ? "text-amber-500" : ""}
              `}
              />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-md ${action.shadow} group-hover:scale-110 transition-transform duration-200`}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {action.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{action.sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom Grid: Partner Card + Activity ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Partner Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Your partner
          </h2>

          {partner ? (
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16 border-2 border-rose-100">
                  <AvatarImage
                    src={partner.image ?? undefined}
                    alt={partner.name ?? ""}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 text-lg font-bold">
                    {getInitials(partner.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Online dot (decorative) */}
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base truncate">
                  {partner.name ?? "Partner"}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {partner.email}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3 text-rose-400" />
                  <p className="text-xs text-gray-400">
                    Together since{" "}
                    {format(
                      new Date(anniversaryDate ?? joinDate),
                      "MMMM d, yyyy"
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Partner hasn&apos;t joined yet</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-50 flex gap-2">
            <Button
              asChild
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-rose-100 border-0 rounded-xl h-9 text-sm"
            >
              <Link href="/memories">
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Memories
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 rounded-xl h-9 text-sm border-gray-200"
            >
              <Link href="/memories">
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Memories
              </Link>
            </Button>
          </div>
        </div>

        {/* Milestones / Journey Panel */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              Your journey
            </h2>
            <Link
              href="/timeline"
              className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Milestone items */}
            {[
              {
                icon: Heart,
                color: "bg-rose-100 text-rose-500",
                label: "Couple connected",
                date: format(new Date(couple.createdAt), "MMM d, yyyy"),
              },
              ...(anniversaryDate
                ? [
                    {
                      icon: Star,
                      color: "bg-amber-100 text-amber-500",
                      label: "Anniversary set",
                      date: format(new Date(anniversaryDate), "MMM d, yyyy"),
                    },
                  ]
                : []),
              {
                icon: MessageCircle,
                color: "bg-blue-100 text-blue-500",
                label: `${messageCount.toLocaleString()} messages sent`,
                date: "All time",
              },
              {
                icon: Camera,
                color: "bg-violet-100 text-violet-500",
                label: `${memoryCount} memories captured`,
                date: "All time",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
              </div>
            ))}

            {!anniversaryDate && (
              <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 p-3 mt-2">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-rose-700">
                      Set your anniversary date
                    </p>
                    <Link
                      href="/settings"
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                    >
                      Go to settings →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {memoryCount === 0 && (
            <div className="mt-4">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full rounded-xl border-dashed border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
              >
                <Link href="/memories">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add your first memory
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export function CouplePage() {
  const router = useRouter();
  const [couple, setCouple] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coupleRes, sessionRes] = await Promise.all([
          fetch("/api/couples"),
          fetch("/api/auth/session"),
        ]);
        const coupleData = await coupleRes.json();
        const sessionData = await sessionRes.json();

        if (coupleData.success && coupleData.data) {
          // Fetch counts if available
          const c = coupleData.data as CoupleData;
          setCouple(c);
        }
        if (sessionData?.user?.id) {
          setCurrentUserId(sessionData.user.id);
        }
      } catch {
        setCouple(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center animate-pulse">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (couple) {
    return (
      <ConnectedDashboard couple={couple} currentUserId={currentUserId} />
    );
  }

  return (
    <>
      <NoCoupleScreen
        onCreateOpen={() => setCreateOpen(true)}
        onJoinOpen={() => setJoinOpen(true)}
      />
      <CreateCoupleDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) router.refresh();
        }}
      />
      <JoinCoupleDialog
        open={joinOpen}
        onOpenChange={(open) => {
          setJoinOpen(open);
          if (!open) router.refresh();
        }}
      />
    </>
  );
}

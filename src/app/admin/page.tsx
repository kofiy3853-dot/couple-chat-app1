"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, MessageSquare, Flag, Activity, HardDrive } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalCouples: number;
  totalMessages: number;
  pendingReports: number;
  storageUsage: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Failed to load statistics
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/50",
      subtitle: "Last 30 days",
    },
    {
      title: "Total Couples",
      value: stats.totalCouples.toLocaleString(),
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/50",
    },
    {
      title: "Messages Sent",
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports.toLocaleString(),
      icon: Flag,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/50",
    },
    {
      title: "Storage Usage",
      value: stats.storageUsage,
      icon: HardDrive,
      color: "text-gray-600",
      bg: "bg-gray-50 dark:bg-gray-800/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your application
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

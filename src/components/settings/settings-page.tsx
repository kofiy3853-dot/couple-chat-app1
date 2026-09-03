"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "./account-settings";
import { PrivacySettings } from "./privacy-settings";
import { NotificationSettings } from "./notification-settings";
import { SecuritySettings } from "./security-settings";
import { Loader2 } from "lucide-react";

interface SettingsData {
  profile: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    role: string;
    status: string;

    createdAt: string;
    updatedAt: string;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    readReceipts: boolean;
  };
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Failed to load settings
      </div>
    );
  }

  if (!settings.profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Failed to load profile
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences and privacy
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSettings profile={settings.profile} onUpdate={fetchSettings} />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings
            privacy={settings.privacy}
            onUpdate={fetchSettings}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

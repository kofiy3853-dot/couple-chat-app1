"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Heart, UserPlus, Image, Calendar } from "lucide-react";

interface NotificationPreferences {
  messageNotifications: boolean;
  reactionNotifications: boolean;
  invitationNotifications: boolean;
  memoryNotifications: boolean;
  timelineNotifications: boolean;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messageNotifications: true,
    reactionNotifications: true,
    invitationNotifications: true,
    memoryNotifications: true,
    timelineNotifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.data.notifications) {
          setPreferences(data.data.notifications);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: preferences }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Notification preferences saved");
      } else {
        setMessage(data.error?.message ?? "Failed to save");
      }
    } catch {
      setMessage("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Notification Preferences</CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <MessageSquare className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Message notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when you receive new messages
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.messageNotifications}
              onCheckedChange={(checked) => handleToggle("messageNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Reaction notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when someone reacts to your messages
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.reactionNotifications}
              onCheckedChange={(checked) => handleToggle("reactionNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <UserPlus className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Invitation notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified about couple invitations
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.invitationNotifications}
              onCheckedChange={(checked) => handleToggle("invitationNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <Image className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Memory notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when new memories are created
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.memoryNotifications}
              onCheckedChange={(checked) => handleToggle("memoryNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <Calendar className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Timeline notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when timeline events are added
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.timelineNotifications}
              onCheckedChange={(checked) => handleToggle("timelineNotifications", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
        {message && (
          <p className={`text-sm ${message.includes("saved") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

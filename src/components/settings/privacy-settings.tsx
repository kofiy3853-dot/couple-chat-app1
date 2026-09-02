"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Clock, CheckCheck } from "lucide-react";

interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  readReceipts: boolean;
}

interface PrivacySettingsProps {
  privacy: PrivacySettings;
  onUpdate: () => void;
}

export function PrivacySettings({ privacy, onUpdate }: PrivacySettingsProps) {
  const [settings, setSettings] = useState(privacy);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(key: keyof PrivacySettings, value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaving(key);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy: { [key]: value } }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
      } else {
        setSettings((prev) => ({ ...prev, [key]: !value }));
      }
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Privacy Settings</CardTitle>
          <CardDescription>Control who can see your activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <Eye className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Show online status</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Let others see when you are online
                </p>
              </div>
            </div>
            <Switch
              checked={settings.showOnlineStatus}
              onCheckedChange={(checked) => handleToggle("showOnlineStatus", checked)}
              disabled={saving === "showOnlineStatus"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <Clock className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Show last seen</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Let others see when you were last active
                </p>
              </div>
            </div>
            <Switch
              checked={settings.showLastSeen}
              onCheckedChange={(checked) => handleToggle("showLastSeen", checked)}
              disabled={saving === "showLastSeen"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50">
                <CheckCheck className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Read receipts</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Let others know when you have read their messages
                </p>
              </div>
            </div>
            <Switch
              checked={settings.readReceipts}
              onCheckedChange={(checked) => handleToggle("readReceipts", checked)}
              disabled={saving === "readReceipts"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

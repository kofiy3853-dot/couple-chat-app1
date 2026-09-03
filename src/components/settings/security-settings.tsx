"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Monitor, Smartphone, Globe, LogOut } from "lucide-react";

export function SecuritySettings() {
  const [logoutAllDialogOpen, setLogoutAllDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLogoutAll() {
    setLoggingOut(true);
    try {
      // Demo mode - just show message
      setMessage("Demo mode: logout not available");
      setLogoutAllDialogOpen(false);
    } catch {
      setMessage("Failed to logout all sessions");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Session</p>
                <p className="text-xs text-gray-500">Windows - Chrome</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
              Active
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mobile Session</p>
                <p className="text-xs text-gray-500">iOS - Safari</p>
              </div>
            </div>
            <Badge variant="outline">Other</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Session History</CardTitle>
          <CardDescription>Information about your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Password last changed</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">Unknown</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Account created</span>
            <span className="text-sm text-gray-900 dark:text-gray-100">Unknown</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 dark:border-orange-900 bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-orange-600">Dangerous Actions</CardTitle>
          <CardDescription>These actions will affect all your sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={logoutAllDialogOpen} onOpenChange={setLogoutAllDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/50">
                <LogOut className="mr-2 h-4 w-4" />
                Logout All Sessions
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Logout all sessions?</DialogTitle>
                <DialogDescription>
                  This will sign you out from all devices. You will need to sign in again on each device.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLogoutAllDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleLogoutAll} disabled={loggingOut}>
                  {loggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Logout All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {message && (
            <p className="mt-3 text-sm text-orange-600">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
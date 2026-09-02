"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, ChevronLeft, ChevronRight, Ban, CheckCircle } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastSeenAt: string | null;
  _count: {
    coupleMembers: number;
    sentMessages: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{ user: User; action: "suspend" | "restore" } | null>(null);
  const [acting, setActing] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  async function handleAction() {
    if (!actionDialog) return;
    setActing(true);
    try {
      const newStatus = actionDialog.action === "suspend" ? "SUSPENDED" : "ACTIVE";
      const res = await fetch(`/api/admin/users/${actionDialog.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === actionDialog.user.id ? { ...u, status: newStatus } : u
          )
        );
        setActionDialog(null);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          User Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage user accounts and permissions
        </p>
      </div>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Joined</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                              {user.username && (
                                <p className="text-xs text-gray-500">@{user.username}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="py-3 px-2">
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {user.status === "ACTIVE" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionDialog({ user, action: "suspend" })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionDialog({ user, action: "restore" })}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "suspend" ? "Suspend User" : "Restore User"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.action === "suspend"
                ? `Are you sure you want to suspend ${actionDialog?.user.name}? They will not be able to access the application.`
                : `Are you sure you want to restore ${actionDialog?.user.name}? They will regain access to the application.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={actionDialog?.action === "suspend" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={acting}
            >
              {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog?.action === "suspend" ? "Suspend" : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

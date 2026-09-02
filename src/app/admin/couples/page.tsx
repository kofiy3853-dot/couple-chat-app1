"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ChevronLeft, ChevronRight, Heart, MessageSquare } from "lucide-react";

interface CoupleMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Couple {
  id: string;
  createdAt: string;
  members: CoupleMember[];
  messageCount: number;
  memoryCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminCouplesPage() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  async function fetchCouples() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const res = await fetch(`/api/admin/couples?${params}`);
      const data = await res.json();
      if (data.success) {
        setCouples(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch couples:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCouples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Couple Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage couple connections
        </p>
      </div>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
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
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Members</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Created</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Messages</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Memories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couples.map((couple) => (
                      <tr key={couple.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {couple.members.map((member, i) => (
                              <div key={member.id} className="flex items-center gap-2">
                                {i > 0 && <span className="text-gray-400">&</span>}
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={member.image || undefined} />
                                    <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                                      {member.name?.charAt(0)?.toUpperCase() ?? "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {member.name}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-500">
                          {new Date(couple.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {couple.messageCount.toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Heart className="h-3.5 w-3.5" />
                            {couple.memoryCount}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} couples)
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
    </div>
  );
}

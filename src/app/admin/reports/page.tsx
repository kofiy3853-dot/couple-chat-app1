"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  reporter: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  reviewedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
  REVIEWED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

const reasonLabels: Record<string, string> = {
  HARASSMENT: "Harassment",
  SPAM: "Spam",
  INAPPROPRIATE_CONTENT: "Inappropriate Content",
  IMPERSONATION: "Impersonation",
  OTHER: "Other",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Report Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review and manage user reports
        </p>
      </div>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No reports found
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Reporter</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Reason</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">Created</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={report.reporter.image || undefined} />
                              <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                                {report.reporter.name?.charAt(0)?.toUpperCase() ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-gray-900 dark:text-gray-100">
                              {report.reporter.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                          {report.targetType}
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                          {reasonLabels[report.reason] ?? report.reason}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusColors[report.status] ?? ""}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} reports)
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

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Report #{selectedReport?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reporter</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedReport.reporter.image || undefined} />
                      <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                        {selectedReport.reporter.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedReport.reporter.name ?? selectedReport.reporter.email}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusColors[selectedReport.status] ?? ""}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Target Type</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedReport.targetType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reason</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{reasonLabels[selectedReport.reason] ?? selectedReport.reason}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  {selectedReport.description}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Target ID</p>
                <p className="text-sm text-gray-500 font-mono">{selectedReport.targetId}</p>
              </div>

              {selectedReport.adminNote && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Admin Note</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    {selectedReport.adminNote}
                  </p>
                </div>
              )}

              {selectedReport.reviewedBy && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Reviewed By</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedReport.reviewedBy.name ?? selectedReport.reviewedBy.email}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

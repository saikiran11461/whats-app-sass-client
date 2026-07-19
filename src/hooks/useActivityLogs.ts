import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface ActivityLog {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: "create" | "update" | "delete" | "login" | "logout" | "export" | "import" | "send" | "approve" | "reject" | "archive" | "restore";
  module: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ActivitySummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byAction: Array<{ action: string; count: number }>;
  byModule: Array<{ module: string; count: number }>;
}

export function useActivityLogs(params?: { page?: number; limit?: number; module?: string; action?: string }) {
  return useQuery({
    queryKey: queryKeys.activityLogs.all,
    queryFn: () => api.get<ActivityLog[]>("/activity", { params }),
    select: (res) => ({ logs: res.data, pagination: res.pagination }),
  });
}

export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.activityLogs.recent, limit],
    queryFn: () => api.get<ActivityLog[]>("/activity/recent", { params: { limit } }),
    select: (res) => res.data,
    staleTime: 30000,
  });
}

export function useActivitySummary() {
  return useQuery({
    queryKey: queryKeys.activityLogs.summary,
    queryFn: () => api.get<ActivitySummary>("/activity/summary"),
    select: (res) => res.data,
    staleTime: 60000,
  });
}

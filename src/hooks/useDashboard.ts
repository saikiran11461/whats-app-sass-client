import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface DashboardStats {
  totalMessages: number;
  totalContacts: number;
  activeConversations: number;
  deliveryRate: number;
  failedMessages: number;
  messagesSentToday: number;
  newContactsThisWeek: number;
  campaignsActive: number;
}

export interface GrowthData {
  labels: string[];
  messages: number[];
  contacts: number[];
  conversations: number[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => api.get<DashboardStats>("/dashboard/stats"),
    select: (res) => res.data,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

export function useDashboardGrowth() {
  return useQuery({
    queryKey: queryKeys.dashboard.growth,
    queryFn: () => api.get<GrowthData>("/dashboard/growth"),
    select: (res) => res.data,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

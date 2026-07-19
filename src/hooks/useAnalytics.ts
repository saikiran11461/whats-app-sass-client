import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface AnalyticsData {
  totalMessages: number;
  totalContacts: number;
  totalConversations: number;
  totalCampaigns: number;
  messagesByDay: Array<{ date: string; count: number }>;
  messagesByStatus: Array<{ status: string; count: number }>;
  contactsBySource: Array<{ source: string; count: number }>;
  topContacts: Array<{ name: string; phone: string; messageCount: number }>;
  campaignsSummary: {
    total: number;
    completed: number;
    running: number;
    failed: number;
  };
  deliveryRate: number;
  readRate: number;
  responseRate: number;
}

export interface HourlyBreakdown {
  hour: number;
  messages: number;
  conversations: number;
}

export function useAnalytics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.analytics.all,
    queryFn: () => api.get<AnalyticsData>("/analytics", { params }),
    select: (res) => res.data,
    staleTime: 60000,
  });
}

export function useHourlyBreakdown(params?: { date?: string }) {
  return useQuery({
    queryKey: queryKeys.analytics.hourly,
    queryFn: () => api.get<HourlyBreakdown[]>("/analytics/hourly", { params }),
    select: (res) => res.data,
    staleTime: 60000,
  });
}

export function useGenerateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/analytics/snapshot"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

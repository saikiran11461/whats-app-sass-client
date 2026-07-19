import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Report {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalMessages: number;
    totalContacts: number;
    newContacts: number;
    totalConversations: number;
    activeConversations: number;
  };
  messageStats: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    deliveryRate: number;
    readRate: number;
  };
  campaignStats: {
    total: number;
    completed: number;
    running: number;
    failed: number;
  };
  topTemplates: Array<{
    name: string;
    uses: number;
  }>;
  activityTimeline: Array<{
    date: string;
    actions: number;
  }>;
}

export function useDailyReport(date?: string) {
  return useQuery({
    queryKey: [...queryKeys.reports.daily, date],
    queryFn: () => api.get<Report>("/reports/daily", { params: { date } }),
    select: (res) => res.data,
    staleTime: 60000,
  });
}

export function useWeeklyReport() {
  return useQuery({
    queryKey: queryKeys.reports.weekly,
    queryFn: () => api.get<Report>("/reports/weekly"),
    select: (res) => res.data,
    staleTime: 120000,
  });
}

export function useMonthlyReport() {
  return useQuery({
    queryKey: queryKeys.reports.monthly,
    queryFn: () => api.get<Report>("/reports/monthly"),
    select: (res) => res.data,
    staleTime: 300000,
  });
}

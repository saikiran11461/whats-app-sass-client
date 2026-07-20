import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface AppSettings {
  _id: string;
  brandId: string;
  general: {
    timezone: string;
    language: string;
    dateFormat: string;
  };
  notifications: {
    emailAlerts: boolean;
    pushAlerts: boolean;
    campaignReports: "daily" | "weekly" | "never";
    failedMessageAlerts: "instant" | "hourly" | "never";
    contactImportUpdates: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
  };
  api: {
    webhookUrl?: string;
    webhookEvents: string[];
    rateLimitPerMinute: number;
  };
  updatedAt: string;
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => api.get<AppSettings>("/settings"),
    select: (res) => res.data
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) => api.put("/settings", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}

export function useUpdateSettingsSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: any }) =>
      api.put(`/settings/${section}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
  });
}

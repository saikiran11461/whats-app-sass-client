import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Campaign {
  _id: string;
  name: string;
  description?: string;
  templateId?: string;
  templateName?: string;
  contactListId?: string;
  contactCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  status: "draft" | "pending" | "running" | "paused" | "completed" | "cancelled" | "failed";
  scheduledAt?: string;
  launchedAt?: string;
  completedAt?: string;
  totalContacts?: number;
  stats?: {
    sent?: number;
    delivered?: number;
    read?: number;
    failed?: number;
    pending?: number;
    replied?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function useCampaigns(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(params),
    queryFn: () => api.get<Campaign[]>("/campaigns", { params }),
    select: (res) => ({ campaigns: res.data, pagination: res.pagination }),
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: () => api.get<Campaign>(`/campaigns/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Campaign>) => api.post("/campaigns", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: { phone: string; error: string }[];
  contactIds: string[];
}

export function useImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contacts: Record<string, any>[]) =>
      api.post<BulkImportResult>("/contacts/bulk-import", { contacts }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      api.put(`/campaigns/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

export function useLaunchCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/launch`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/pause`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/resume`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

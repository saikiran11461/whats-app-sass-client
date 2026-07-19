import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface AutoReply {
  _id: string;
  name: string;
  type: "keyword" | "welcome" | "away" | "fallback" | "office_hours";
  keyword?: string;
  matchType?: "exact" | "contains" | "starts_with" | "ends_with" | "regex";
  templateId?: string;
  templateName?: string;
  message?: string;
  isActive: boolean;
  triggerCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

export function useAutoReplies(params?: { search?: string; type?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: queryKeys.autoReplies.list(params),
    queryFn: () => api.get<AutoReply[]>("/auto-replies", { params }),
    select: (res) => ({ autoReplies: res.data, pagination: res.pagination }),
  });
}

export function useAutoReply(id: string) {
  return useQuery({
    queryKey: queryKeys.autoReplies.detail(id),
    queryFn: () => api.get<AutoReply>(`/auto-replies/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateAutoReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AutoReply>) => api.post("/auto-replies", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.autoReplies.all }),
  });
}

export function useUpdateAutoReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AutoReply> }) =>
      api.put(`/auto-replies/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.autoReplies.all }),
  });
}

export function useToggleAutoReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/auto-replies/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.autoReplies.all }),
  });
}

export function useDeleteAutoReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auto-replies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.autoReplies.all }),
  });
}

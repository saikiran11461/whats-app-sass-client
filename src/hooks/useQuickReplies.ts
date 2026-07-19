import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface QuickReply {
  _id: string;
  title: string;
  shortcut: string;
  message: string;
  category?: string;
  isActive: boolean;
  useCount: number;
  createdAt: string;
}

export function useQuickReplies(params?: { search?: string; category?: string }) {
  return useQuery({
    queryKey: queryKeys.quickReplies.list(params),
    queryFn: () => api.get<QuickReply[]>("/quick-replies", { params }),
    select: (res) => ({ quickReplies: res.data, pagination: res.pagination }),
  });
}

export function useQuickReply(id: string) {
  return useQuery({
    queryKey: queryKeys.quickReplies.detail(id),
    queryFn: () => api.get<QuickReply>(`/quick-replies/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useQuickReplyCategories() {
  return useQuery({
    queryKey: queryKeys.quickReplies.categories,
    queryFn: () => api.get<string[]>("/quick-replies/categories"),
    select: (res) => res.data,
  });
}

export function useCreateQuickReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QuickReply>) => api.post("/quick-replies", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quickReplies.all }),
  });
}

export function useUpdateQuickReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QuickReply> }) =>
      api.put(`/quick-replies/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quickReplies.all }),
  });
}

export function useDeleteQuickReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quick-replies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.quickReplies.all }),
  });
}

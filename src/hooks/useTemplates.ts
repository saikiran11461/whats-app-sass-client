import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Template {
  _id: string;
  name: string;
  body: string;
  header?: string;
  footer?: string;
  category: "marketing" | "utility" | "authentication" | "otp";
  status: "pending" | "approved" | "rejected" | "disabled";
  language: string;
  rejectionReason?: string;
  totalUses: number;
  lastUsedAt?: string;
  createdAt: string;
}

export function useTemplates(params?: { page?: number; category?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.templates.list(params),
    queryFn: () => api.get<Template[]>("/templates", { params }),
    select: (res) => ({ templates: res.data, pagination: res.pagination }),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.templates.detail(id),
    queryFn: () => api.get<Template>(`/templates/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Template>) => api.post("/templates", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Template> }) =>
      api.put(`/templates/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useApproveTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/templates/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useRejectTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/templates/${id}/reject`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

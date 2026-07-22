import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Template {
  _id: string;
  name: string;
  body?: string;
  content?: string;
  header?: string;
  footer?: string;
  category: "marketing" | "utility" | "authentication" | "otp";
  status: "pending" | "approved" | "rejected" | "disabled";
  language: string;
  rejectionReason?: string;
  error?: string;
  errorCode?: string;
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

export function useCloneTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/clone`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useSubmitToMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/submit-to-meta`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useSyncWithMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/templates/${id}/sync`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export function useBulkSyncWithMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/templates/sync-all`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  });
}

export interface MetaApprovedTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
    example?: any;
    cards?: any[];
  }>;
  previousCategory?: string;
}

/**
 * Fetch APPROVED templates directly from Meta Cloud API.
 * These are read-only reference templates (like "hello_world") that show users
 * what a correctly formatted, approved template looks like.
 * They cannot be deleted or modified through our app.
 */
export function useMetaApprovedTemplates() {
  return useQuery({
    queryKey: ['templates', 'meta-approved'],
    queryFn: () => api.get<MetaApprovedTemplate[]>('/templates/meta-approved'),
    select: (res) => (res.data || []) as MetaApprovedTemplate[],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
}

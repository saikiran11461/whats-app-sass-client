import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Brand {
  _id: string;
  businessName: string;
  phoneNumber?: string;
  description?: string;
  industry?: string;
  website?: string;
  logo?: string;
  timezone: string;
  language: string;
  theme: string;
  connectionStatus: "healthy" | "token_expired" | "disconnected";
  tokenExpiry?: string | null;
  lastSync?: string | null;
  messageCount?: number;
  contactCount?: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands", "list"],
    queryFn: () => api.get<Brand[]>("/brands"),
    select: (res) => res.data,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Brand>) => api.post<Brand>("/brands", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands", "list"] }),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) =>
      api.put<Brand>(`/brands/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands", "list"] }),
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/brands/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands", "list"] }),
  });
}

export function useReconnectBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Brand>(`/brands/${id}/reconnect`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands", "list"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Schedule {
  _id: string;
  name: string;
  description?: string;
  templateId?: string;
  templateName?: string;
  scheduledAt: string;
  status: "active" | "paused" | "completed" | "failed" | "cancelled";
  contactCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export function useSchedules(params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.schedules.list(params),
    queryFn: () => api.get<Schedule[]>("/schedules", { params }),
    select: (res) => ({ schedules: res.data, pagination: res.pagination }),
  });
}

export function useSchedule(id: string) {
  return useQuery({
    queryKey: queryKeys.schedules.detail(id),
    queryFn: () => api.get<Schedule>(`/schedules/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Schedule>) => api.post("/schedules", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all }),
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Schedule> }) =>
      api.put(`/schedules/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all }),
  });
}

export function usePauseSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/schedules/${id}/pause`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all }),
  });
}

export function useResumeSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/schedules/${id}/resume`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all }),
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Notification {
  _id: string;
  title: string;
  description: string;
  type: "new_message" | "campaign_completed" | "campaign_failed" | "device_connected" | "device_disconnected" | "template_approved" | "template_rejected" | "login_alert" | "system";
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
}

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => api.get<Notification[]>("/notifications", { params }),
    select: (res) => ({ notifications: res.data, pagination: res.pagination }),
    refetchInterval: 60000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
    select: (res) => res.data.count,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

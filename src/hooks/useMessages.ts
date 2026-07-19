import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Message {
  _id: string;
  conversationId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  content: string;
  type: "text" | "image" | "video" | "audio" | "document";
  mediaUrl?: string;
  status: "pending" | "queued" | "sent" | "delivered" | "read" | "failed";
  isStarred: boolean;
  isEdited: boolean;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

interface MessagesParams {
  conversationId?: string;
  contactId?: string;
  page?: number;
  limit?: number;
}

export function useMessages(params?: MessagesParams) {
  return useQuery({
    queryKey: queryKeys.messages.list(params),
    queryFn: () => api.get<Message[]>("/messages", { params }),
    select: (res) => ({ messages: res.data, pagination: res.pagination }),
  });
}

export function useMessage(id: string) {
  return useQuery({
    queryKey: queryKeys.messages.detail(id),
    queryFn: () => api.get<Message>(`/messages/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useMessageStats() {
  return useQuery({
    queryKey: queryKeys.messages.stats,
    queryFn: () =>
      api.get<{
        total: number;
        sent: number;
        delivered: number;
        read: number;
        failed: number;
        pending: number;
      }>("/messages/stats"),
    select: (res) => res.data,
    staleTime: 30000,
  });
}

export function useStarredMessages() {
  return useQuery({
    queryKey: queryKeys.messages.starred,
    queryFn: () => api.get<Message[]>("/messages/starred"),
    select: (res) => res.data,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      phone: string;
      contactId: string;
      content?: string;
      templateId?: string;
      mediaUrl?: string;
      type?: string;
    }) => api.post("/messages/send", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.put(`/messages/${id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}

export function useToggleStar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/messages/${id}/star`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}

export function useForwardMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      contactId,
      phone,
    }: {
      id: string;
      contactId: string;
      phone: string;
    }) => api.post(`/messages/${id}/forward`, { contactId, phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}

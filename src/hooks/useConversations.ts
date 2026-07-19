import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Conversation {
  _id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageStatus?: string;
  unreadCount: number;
  status: "active" | "archived" | "closed" | "pending";
  isPinned: boolean;
  assignedTo?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

interface ConversationsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  assignedTo?: string;
}

export function useConversations(params?: ConversationsParams) {
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () => api.get<Conversation[]>("/conversations", { params }),
    select: (res) => ({ conversations: res.data, pagination: res.pagination }),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id),
    queryFn: () => api.get<Conversation>(`/conversations/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.conversations.unreadCount,
    queryFn: () => api.get<{ count: number }>("/conversations/unread-count"),
    select: (res) => res.data.count,
    refetchInterval: 30000, 
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { contactId: string; contactPhone: string }) =>
      api.post("/conversations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useUnarchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/unarchive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/pin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) =>
      api.put(`/conversations/${id}/assign`, { assignedTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useCloseConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/conversations/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

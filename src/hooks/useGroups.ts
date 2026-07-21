import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { Contact } from "./useContacts";

export interface Group {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useGroups(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.groups.list(params),
    queryFn: () => api.get<Group[]>("/groups", { params }),
    select: (res) => ({ groups: res.data, pagination: res.pagination }),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => api.get<Group>(`/groups/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useGroupContacts(id: string, params?: { page?: number }) {
  return useQuery({
    queryKey: queryKeys.groups.contacts(id),
    queryFn: () => api.get<Contact[]>(`/groups/${id}/contacts`, { params }),
    select: (res) => ({ contacts: res.data, pagination: res.pagination }),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Group>) => api.post("/groups", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Group> }) =>
      api.put(`/groups/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/groups/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all }),
  });
}

export function useAddGroupContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contactIds }: { id: string; contactIds: string[] }) =>
      api.post(`/groups/${id}/contacts`, { contactIds }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.contacts(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useImportGroupContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contactIds }: { id: string; contactIds: string[] }) =>
      api.post(`/groups/${id}/contacts/bulk-import`, { contactIds }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.contacts(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export interface ImportContactInput {
  name?: string;
  phone: string;
  email?: string;
}

export function useImportContactsToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contacts }: { id: string; contacts: ImportContactInput[] }) =>
      api.post(`/groups/${id}/contacts/import`, { contacts }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.contacts(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useRemoveGroupContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, contactId }: { id: string; contactId: string }) =>
      api.delete(`/groups/${id}/contacts/${contactId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.contacts(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export interface SendToGroupResult {
  total: number;
  sent: number;
  failed: number;
  failures: { phone: string; reason: string }[];
}

export function useSendToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, templateId, mediaUrl, messageType }: { id: string; content?: string; templateId?: string; mediaUrl?: string; messageType?: string }) =>
      api.post<SendToGroupResult>(`/groups/${id}/send`, { content, templateId, mediaUrl, messageType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

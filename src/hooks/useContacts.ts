import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Contact {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  notes?: string;
  status: "active" | "blocked" | "archived";
  isFavorite: boolean;
  totalMessages: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useContacts(params?: ContactsParams) {
  return useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: () => api.get<Contact[]>("/contacts", { params }),
    select: (res) => ({ contacts: res.data, pagination: res.pagination }),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => api.get<Contact>(`/contacts/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useContactDuplicates() {
  return useQuery({
    queryKey: queryKeys.contacts.duplicates,
    queryFn: () => api.get<Contact[]>("/contacts/duplicates"),
    select: (res) => res.data,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contact>) => api.post("/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      api.put(`/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/contacts/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useToggleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/contacts/${id}/block`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useBulkImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contacts: Partial<Contact>[]) =>
      api.post("/contacts/bulk-import", { contacts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useMergeContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { primaryId: string; secondaryIds: string[] }) =>
      api.post("/contacts/merge", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

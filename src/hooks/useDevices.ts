import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export interface Device {
  _id: string;
  phone: string;
  brandName: string;
  status: "connected" | "disconnected" | "connecting" | "reconnecting" | "expired";
  apiVersion: string;
  tokenExpiry: string;
  lastConnectedAt?: string;
  createdAt: string;
}

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices.all,
    queryFn: () => api.get<Device[]>("/devices"),
    select: (res) => res.data,
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id),
    queryFn: () => api.get<Device>(`/devices/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useGenerateQR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ qrCode: string; deviceId: string }>("/devices/generate-qr"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

export function useRefreshQR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/devices/${id}/refresh-qr`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

export function useDisconnectDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/devices/${id}/disconnect`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/devices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

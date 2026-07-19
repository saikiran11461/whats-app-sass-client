import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UploadResult {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<UploadResult>("/uploads/single", formData, onProgress);
    },
  });
}

export function useUploadMultiple() {
  return useMutation({
    mutationFn: ({
      files,
      onProgress,
    }: {
      files: File[];
      onProgress?: (progress: number) => void;
    }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      return api.upload<UploadResult[]>("/uploads/multiple", formData, onProgress);
    },
  });
}

export function useDeleteFile() {
  return useMutation({
    mutationFn: (url: string) => api.delete("/uploads", { data: { url } }),
  });
}

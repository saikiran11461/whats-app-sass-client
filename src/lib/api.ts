import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  success: boolean;
  message: string;
  errorCode?: string;
  errors?: { field: string; message: string }[];
  stack?: string;
}

// Axios instance with defaults
const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true, // Send httpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Track refresh state to avoid multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

// Max retries for network errors
const MAX_CONNECTION_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Attempt to refresh the auth token via the refresh endpoint
 * Sends empty body - server reads refresh token from httpOnly cookie
 */
async function attemptTokenRefresh(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = apiClient
    .post("/auth/refresh-token", {}, { timeout: 10000 })
    .then(() => {
      isRefreshing = false;
      refreshPromise = null;
    })
    .catch((err) => {
      isRefreshing = false;
      refreshPromise = null;
      throw err;
    });

  return refreshPromise;
}

/**
 * Delay helper for retry
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Response interceptor for token refresh and connection retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Network error (no response) — retry with backoff
    if (!error.response && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }
    
    if (!error.response && originalRequest._retryCount !== undefined) {
      if (originalRequest._retryCount < MAX_CONNECTION_RETRIES) {
        originalRequest._retryCount++;
        await delay(RETRY_DELAY_MS * originalRequest._retryCount);
        return apiClient(originalRequest);
      }
    }

    // If 401 and not already retrying, attempt token refresh.
    // Skip this when the failing request IS the refresh call itself,
    // otherwise a 401 refresh response deadlocks (queues behind itself forever).
    const isRefreshRequest = originalRequest.url === "/auth/refresh-token";
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await attemptTokenRefresh();
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Only redirect to login if not already on login page
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API helper methods
export const api = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    apiClient.get(url, config).then((res) => res.data),

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config).then((res) => res.data),

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config).then((res) => res.data),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config).then((res) => res.data),

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config).then((res) => res.data),

  upload: <T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> =>
    apiClient.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    }),
};

// Query key factory for React Query
export const queryKeys = {
  auth: {
    profile: ["auth", "profile"] as const,
    users: ["auth", "users"] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    growth: ["dashboard", "growth"] as const,
  },
  contacts: {
    all: ["contacts"] as const,
    list: (params?: any) => ["contacts", "list", params] as const,
    detail: (id: string) => ["contacts", id] as const,
    duplicates: ["contacts", "duplicates"] as const,
  },
  conversations: {
    all: ["conversations"] as const,
    list: (params?: any) => ["conversations", "list", params] as const,
    detail: (id: string) => ["conversations", id] as const,
    unreadCount: ["conversations", "unread-count"] as const,
  },
  messages: {
    all: ["messages"] as const,
    list: (params?: any) => ["messages", "list", params] as const,
    detail: (id: string) => ["messages", id] as const,
    stats: ["messages", "stats"] as const,
    starred: ["messages", "starred"] as const,
  },
  campaigns: {
    all: ["campaigns"] as const,
    list: (params?: any) => ["campaigns", "list", params] as const,
    detail: (id: string) => ["campaigns", id] as const,
  },
  templates: {
    all: ["templates"] as const,
    list: (params?: any) => ["templates", "list", params] as const,
    detail: (id: string) => ["templates", id] as const,
  },
  schedules: {
    all: ["schedules"] as const,
    list: (params?: any) => ["schedules", "list", params] as const,
    detail: (id: string) => ["schedules", id] as const,
  },
  quickReplies: {
    all: ["quick-replies"] as const,
    list: (params?: any) => ["quick-replies", "list", params] as const,
    categories: ["quick-replies", "categories"] as const,
    detail: (id: string) => ["quick-replies", id] as const,
  },
  autoReplies: {
    all: ["auto-replies"] as const,
    list: (params?: any) => ["auto-replies", "list", params] as const,
    detail: (id: string) => ["auto-replies", id] as const,
  },
  brands: {
    current: ["brands"] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  devices: {
    all: ["devices"] as const,
    detail: (id: string) => ["devices", id] as const,
  },
  groups: {
    all: ["groups"] as const,
    list: (params?: any) => ["groups", "list", params] as const,
    detail: (id: string) => ["groups", id] as const,
    contacts: (id: string) => ["groups", id, "contacts"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    hourly: ["analytics", "hourly"] as const,
  },
  reports: {
    daily: ["reports", "daily"] as const,
    weekly: ["reports", "weekly"] as const,
    monthly: ["reports", "monthly"] as const,
  },
  activityLogs: {
    all: ["activity-logs"] as const,
    recent: ["activity-logs", "recent"] as const,
    summary: ["activity-logs", "summary"] as const,
  },
};

export default apiClient;

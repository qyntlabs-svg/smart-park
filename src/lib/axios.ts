import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { getTokenSync } from "@/lib/token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Sync interceptor — reads from Zustand or localStorage directly
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token ?? getTokenSync();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 → clear auth and redirect (only for our API)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      if (!url.includes("razorpay.com")) {
        useAuthStore.getState().clearAuth();
        window.location.replace("/#/login");
      }
    }
    return Promise.reject(error);
  },
);

export default api;

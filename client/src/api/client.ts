import axios, { type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "../store/authStore"

export const api = axios.create({
  baseURL: import.meta.env.VITE_FRONTEND_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig | undefined
    const isAuthCall = original?.url?.startsWith("/auth/")

    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error)
    }

    // Access token expired (15m): get a new one from the refresh cookie and retry once.
    // If the refresh fails, the store marks the user as logged out and ProtectedRoute redirects.
    original._retry = true
    try {
      await useAuthStore.getState().refresh()
      return api(original)
    } catch {
      return Promise.reject(error)
    }
  },
)

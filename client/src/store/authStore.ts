import axios from "axios"
import { create } from "zustand"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<string>;
  restoreSession: () => Promise<void>;
}


let refreshPromise: Promise<string> | null = null

export const useAuthStore = create<AuthState>()((set, get) => ({
  accessToken: null,
  status: "loading",

  login: async (email, password) => {
    const res = await axios.post<{ accessToken: string }>(
      "/api/auth/login",
      { email, password },
      { withCredentials: true },
    )
    set({ accessToken: res.data.accessToken, status: "authenticated" })
  },

  logout: async () => {
    try{
      await axios.post("api/auth/logout",null,{withCredentials: true})
    } finally{
      refreshPromise = null
      set({ accessToken: null, status: "unauthenticated" })
    }
    
  },

  refresh: () => {
    if (!refreshPromise) {
      refreshPromise = axios
        .post<{ accessToken: string }>("/api/auth/refresh", null, { withCredentials: true })
        .then((res) => {
          set({ accessToken: res.data.accessToken, status: "authenticated" })
          return res.data.accessToken
        })
        .catch((error) => {
          set({ accessToken: null, status: "unauthenticated" })
          throw error
        })
        .finally(() => {
          refreshPromise = null
        })
    }
    return refreshPromise
  },


  restoreSession: async () => {
    try {
      await get().refresh()
    } catch {
      
    }
  },
}))

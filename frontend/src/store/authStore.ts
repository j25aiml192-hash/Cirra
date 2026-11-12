import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string) => void;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("cirra_token") : null,
  user: null,
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cirra_token", token);
    }
    set({ token });
  },
  setUser: (user: AuthState["user"]) => {
    set({ user });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cirra_token");
    }
    set({ token: null, user: null });
  },
}));

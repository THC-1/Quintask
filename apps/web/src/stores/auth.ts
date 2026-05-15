import { defineStore } from "pinia";

import { apiFetch } from "../api/client";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  role: "OWNER" | "MEMBER" | "TEACHER";
};

type AuthState = {
  user: CurrentUser | null;
  token: string | null;
};

type LoginResponse = {
  token: string;
  user: CurrentUser;
};

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem("quintask_token")
  }),
  getters: {
    isOwner: (state) => state.user?.role === "OWNER",
    isTeacher: (state) => state.user?.role === "TEACHER"
  },
  actions: {
    async login(username: string, password: string) {
      const result = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      this.token = result.token;
      this.user = result.user;
      localStorage.setItem("quintask_token", result.token);
    },
    async loadMe() {
      if (!this.token) {
        return;
      }

      this.user = await apiFetch<CurrentUser>("/auth/me");
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("quintask_token");
    }
  }
});

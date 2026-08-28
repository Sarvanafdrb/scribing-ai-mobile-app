import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AuthUser, toPersistedAuthUser } from "@/types/auth.types";
import { useWorkspaceStore } from "@/store/workspace.store";
import { asyncStorageAdapter, secureStorage } from "@/store/storage";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;

  setAuth: (
    user: AuthUser | null,
    token: string | null,
    refreshToken?: string | null,
  ) => void;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
  updateToken: (token: string) => void;
}

const AUTH_STORAGE_KEY = "auth-storage";
const WORKSPACE_STORAGE_KEY = "workspace-storage";

export const clearPersistedAuthStorage = async () => {
  await secureStorage.removeItem(AUTH_STORAGE_KEY);
  await asyncStorageAdapter.removeItem(WORKSPACE_STORAGE_KEY);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: true,
      _hasHydrated: false,

      setAuth: (user, token, refreshToken) => {
        set({
          user: toPersistedAuthUser(user),
          token,
          refreshToken: refreshToken || null,
          isLoading: false,
        });
      },

      setUser: (user) => set({ user: toPersistedAuthUser(user) }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      updateToken: (token) => set({ token }),

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isLoading: false,
          _hasHydrated: true,
        });
        useWorkspaceStore.getState().clearWorkspace();
        void clearPersistedAuthStorage();
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: toPersistedAuthUser(state.user),
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<AuthState>;
        return {
          ...currentState,
          ...persisted,
          user: toPersistedAuthUser(persisted.user ?? null),
          token: persisted.token ?? null,
          refreshToken: persisted.refreshToken ?? null,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.setUser(toPersistedAuthUser(state.user));
        }
        state?.setHasHydrated(true);
        state?.setLoading(false);
      },
    },
  ),
);

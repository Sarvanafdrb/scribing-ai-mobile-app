import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Workspace } from "@/types/workspace.types";
import { asyncStorageAdapter } from "@/store/storage";

interface WorkspaceState {
  selectedWorkspace: Workspace | null;
  _hasHydrated: boolean;

  setSelectedWorkspace: (workspace: Workspace | null) => void;
  setHasHydrated: (state: boolean) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedWorkspace: null,
      _hasHydrated: false,

      setSelectedWorkspace: (workspace) => set({ selectedWorkspace: workspace }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      clearWorkspace: () => set({ selectedWorkspace: null }),
    }),
    {
      name: "workspace-storage",
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (state) => ({
        selectedWorkspace: state.selectedWorkspace,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

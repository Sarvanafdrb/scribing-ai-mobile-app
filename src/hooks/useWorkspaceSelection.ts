import { useCallback } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useAuthStore } from "@/store/auth.store";
import { Workspace } from "@/types/workspace.types";
import { isDoctorUser } from "@/types/auth.types";
import { sessionKeys } from "@/services/query-keys";
import { patientKeys } from "@/services/query-keys";
import { transcriptKeys } from "@/services/query-keys";
import { workspaceKeys } from "@/services/workspace.queries";
import { workspaceService } from "@/services/workspace.service";
import { getDefaultWorkspace } from "@/utils/workspace.utils";

export const invalidateWorkspaceData = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
  queryClient.invalidateQueries({ queryKey: sessionKeys.all });
  queryClient.invalidateQueries({ queryKey: patientKeys.all });
  queryClient.invalidateQueries({ queryKey: transcriptKeys.all });
};

export const useWorkspaceSelection = () => {
  const queryClient = useQueryClient();
  const { selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();

  const selectWorkspace = useCallback(
    (workspace: Workspace) => {
      setSelectedWorkspace(workspace);
      invalidateWorkspaceData(queryClient);
    },
    [queryClient, setSelectedWorkspace],
  );

  const switchWorkspace = useCallback(
    (workspace: Workspace) => {
      if (workspace.status !== "active") {
        Alert.alert(
          "Workspace unavailable",
          "This workspace is inactive. Contact your administrator.",
        );
        return;
      }

      if (selectedWorkspace?.id === workspace.id) return;

      selectWorkspace(workspace);
      Alert.alert("Workspace switched", `Now working in ${workspace.name}`);
    },
    [selectWorkspace, selectedWorkspace?.id],
  );

  return {
    selectedWorkspace,
    selectWorkspace,
    switchWorkspace,
  };
};

/**
 * Same post-login workspace resolution as web.
 * Mobile route mapping:
 * - no workspace → /access-not-assigned
 * - doctor → /(tabs)  (doctor workspace home)
 * - other roles → /(tabs) (doctor mobile app entry; admin lives on web)
 */
export const resolvePostLoginWorkspace = async (): Promise<{
  redirectTo: string;
  workspace?: Workspace;
}> => {
  const workspaces = await workspaceService.getAll();
  const defaultWorkspace = getDefaultWorkspace(workspaces);

  if (!defaultWorkspace) {
    useWorkspaceStore.getState().clearWorkspace();
    return { redirectTo: "/access-not-assigned" };
  }

  const user = useAuthStore.getState().user;
  if (isDoctorUser(user)) {
    return { redirectTo: "/(tabs)", workspace: defaultWorkspace };
  }

  return { redirectTo: "/(tabs)", workspace: defaultWorkspace };
};

import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { getUserOrganizationId } from "@/types/auth.types";

export const useTenantScope = () => {
  const user = useAuthStore((state) => state.user);
  const selectedWorkspace = useWorkspaceStore(
    (state) => state.selectedWorkspace,
  );

  const organizationId =
    selectedWorkspace?.organizationId ||
    selectedWorkspace?.id ||
    getUserOrganizationId(user) ||
    "";

  return {
    organizationId,
    workspaceId: selectedWorkspace?.id || "",
    workspaceName:
      selectedWorkspace?.organizationName ||
      selectedWorkspace?.name ||
      user?.organizationName ||
      "",
  };
};

import { useQuery } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { workspaceKeys } from "@/services/workspace.queries";
import { useAuthStore } from "@/store/auth.store";

export const useWorkspaces = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: () => workspaceService.getAll(),
    enabled: Boolean(token),
    staleTime: 30 * 1000,
  });
};

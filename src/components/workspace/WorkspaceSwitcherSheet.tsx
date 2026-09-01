import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useWorkspaceSelection } from "@/hooks/useWorkspaceSelection";
import { useWorkspaceStore } from "@/store/workspace.store";
import type { Workspace } from "@/types/workspace.types";
import { colors, radius, spacing, typography } from "@/theme";

interface WorkspaceSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function WorkspaceSwitcherSheet({
  visible,
  onClose,
}: WorkspaceSwitcherSheetProps) {
  const [search, setSearch] = useState("");
  const { workspaces, isLoading } = useWorkspaces();
  const { switchWorkspace } = useWorkspaceSelection();
  const selectedWorkspace = useWorkspaceStore((s) => s.selectedWorkspace);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workspaces;
    return workspaces.filter(
      (workspace) =>
        workspace.name.toLowerCase().includes(query) ||
        workspace.organizationName.toLowerCase().includes(query) ||
        workspace.organizationCode?.toLowerCase().includes(query),
    );
  }, [search, workspaces]);

  const handleSelect = (workspace: Workspace) => {
    switchWorkspace(workspace);
    setSearch("");
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Switch workspace" onClose={onClose}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search organization…"
            placeholderTextColor={colors.mutedLight}
            style={styles.search}
          />
          {filtered.map((workspace) => {
            const selected = selectedWorkspace?.id === workspace.id;
            return (
              <Pressable
                key={workspace.id}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => handleSelect(workspace)}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{workspace.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    {workspace.organizationName}
                    {workspace.organizationCode
                      ? ` · ${workspace.organizationCode}`
                      : ""}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : (
                  <Ionicons
                    name="ellipse-outline"
                    size={20}
                    color={colors.mutedLight}
                  />
                )}
              </Pressable>
            );
          })}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xl },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.foreground,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowText: { flex: 1 },
  rowTitle: { ...typography.bodyMedium, color: colors.foreground },
  rowSubtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
});

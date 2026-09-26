import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { DoctorCard } from "@/components/patients/DoctorCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { WorkspaceSwitcherSheet } from "@/components/workspace/WorkspaceSwitcherSheet";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAccessControl } from "@/hooks/useAccessControl";
import { getUserOrganizationName } from "@/types/auth.types";
import { colors, spacing, typography } from "@/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const workspace = useWorkspaceStore((s) => s.selectedWorkspace);
  const { workspaces } = useWorkspaces();
  const { canViewMedicines } = useAccessControl();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [workspaceSheetOpen, setWorkspaceSheetOpen] = useState(false);
  const canSwitchWorkspace = workspaces.length > 1;

  const handleLogout = () => {
    logout();
    setConfirmLogout(false);
    router.replace("/(auth)/login");
  };

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <DoctorCard user={user} />

        <Card>
          <Text style={styles.sectionLabel}>Organization</Text>
          <Text style={styles.orgName}>
            {getUserOrganizationName(user) || workspace?.organizationName || "—"}
          </Text>
          {workspace?.organizationCode ? (
            <Text style={styles.orgCode}>Code: {workspace.organizationCode}</Text>
          ) : null}
          {canSwitchWorkspace ? (
            <Pressable
              style={styles.switchWorkspaceBtn}
              onPress={() => setWorkspaceSheetOpen(true)}
            >
              <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
              <Text style={styles.switchWorkspaceText}>Switch workspace</Text>
            </Pressable>
          ) : null}
        </Card>

        <View style={styles.menu}>
          {canViewMedicines() ? (
            <MenuRow
              icon="medkit-outline"
              label="Medicines"
              onPress={() => router.push("/medicines")}
            />
          ) : null}
          <MenuRow
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
          <MenuRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => router.push("/change-password")}
          />
          <MenuRow
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={() => setConfirmLogout(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmLogout}
        title="Sign out?"
        message="You will need to sign in again to continue consultations."
        confirmLabel="Logout"
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />

      <WorkspaceSwitcherSheet
        visible={workspaceSheetOpen}
        onClose={() => setWorkspaceSheetOpen(false)}
      />
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View
        style={[
          styles.menuIcon,
          danger && { backgroundColor: colors.dangerLight },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.danger : colors.primary}
        />
      </View>
      <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    gap: spacing.lg,
  },
  title: { ...typography.title, color: colors.foreground, fontSize: 28 },
  sectionLabel: {
    ...typography.label,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  orgName: { ...typography.bodyMedium, color: colors.foreground },
  orgCode: { ...typography.caption, color: colors.muted, marginTop: 4 },
  switchWorkspaceBtn: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  switchWorkspaceText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    ...typography.bodyMedium,
    color: colors.foreground,
    flex: 1,
  },
});

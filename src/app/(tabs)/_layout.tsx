import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";
import { useAuthValidation } from "@/hooks/useAuthValidation";
import { useWorkspaceGuard } from "@/hooks/useWorkspaceGuard";
import { TAB_BAR_CONTENT_HEIGHT } from "@/constants/layout";
import { colors } from "@/theme";
import { LoadingScreen } from "@/components/ui/EmptyState";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarStyle = useMemo(() => {
    const bottomPad = Math.max(
      insets.bottom,
      Platform.OS === "android" ? 12 : 8,
    );
    return {
      backgroundColor: colors.white,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: TAB_BAR_CONTENT_HEIGHT + bottomPad,
      paddingTop: 8,
      paddingBottom: bottomPad,
      ...(Platform.OS === "android"
        ? { elevation: 16, zIndex: 10 }
        : {}),
    };
  }, [insets.bottom]);

  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const { isValidating } = useAuthValidation();
  const {
    shouldShowLoading,
    shouldBlock,
    hasWorkspaceAccess,
    hasWorkspace,
  } = useWorkspaceGuard();

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/(auth)/login");
    }
  }, [hasHydrated, token]);

  useEffect(() => {
    if (shouldBlock || (!hasWorkspaceAccess && hasHydrated && token)) {
      router.replace("/access-not-assigned");
    }
  }, [shouldBlock, hasWorkspaceAccess, hasHydrated, token]);

  if (!hasHydrated || isValidating || shouldShowLoading) {
    return <LoadingScreen message="Preparing workspace…" />;
  }

  if (!token) {
    return <LoadingScreen message="Redirecting…" />;
  }

  if (shouldBlock || !hasWorkspace) {
    return <LoadingScreen message="Checking workspace access…" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Consultations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

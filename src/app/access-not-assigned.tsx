import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth.store";
import { colors, spacing, typography } from "@/theme";

/**
 * Same purpose as web `/access-not-assigned`:
 * user authenticated but has no active workspace.
 */
export default function AccessNotAssignedScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing["3xl"],
          paddingBottom: insets.bottom + spacing["2xl"],
        },
      ]}
    >
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={36} color={colors.warning} />
        </View>
        <Text style={styles.title}>No workspace assigned</Text>
        <Text style={styles.subtitle}>
          Your account is signed in, but no active organization workspace is
          available. Contact your administrator to get access.
        </Text>
        <Button
          title="Sign out"
          variant="outline"
          onPress={() => {
            logout();
            router.replace("/(auth)/login");
          }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: { gap: spacing.lg, alignItems: "center" },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.heading,
    color: colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
  },
});

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { useSessions } from "@/hooks/sessions/useSession";
import { useAuthStore } from "@/store/auth.store";
import { SESSION_STATUS_LABELS } from "@/constants/status";
import { formatDate } from "@/utils/date.utils";
import { colors, spacing, typography } from "@/theme";

export default function PatientHistoryScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const doctorId = String(user?.id || user?._id || "");

  const { data, isLoading, isError, refetch } = useSessions(
    {
      patientId,
      userId: doctorId,
      page: 1,
      limit: 30,
    },
    Boolean(patientId && doctorId),
  );

  const sessions = data?.sessions || [];

  if (isLoading) return <LoadingScreen message="Loading history…" />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <View style={styles.screen}>
      <GlassHeader title="Visit history" showBack />
      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id || item._id)}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.sm,
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No past consultations found.</Text>
        }
        renderItem={({ item }) => {
          const sessionId = String(item.id || item._id || "");
          return (
            <Pressable
              onPress={() =>
                router.push(`/consultation/${sessionId}` as never)
              }
            >
              <Card style={styles.row}>
                <Text style={styles.title}>{item.title || item.sessionCode}</Text>
                <Text style={styles.meta}>
                  {SESSION_STATUS_LABELS[item.status] || item.status} ·{" "}
                  {formatDate(item.createdAt)}
                </Text>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  row: { gap: 4 },
  title: { ...typography.bodyMedium, color: colors.foreground },
  meta: { ...typography.caption, color: colors.muted },
  empty: { ...typography.body, color: colors.muted, textAlign: "center" },
});

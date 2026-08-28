import React, { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import {
  getPatientFromQueueItem,
  getQueueItemKey,
  resolveQueueSessionId,
  useDoctorQueue,
} from "@/hooks/doctor/useDoctorQueue";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PatientCard } from "@/components/patients/PatientCard";
import { getDoctorDisplayName } from "@/types/auth.types";
import { getSessionDepartmentName } from "@/types/session.types";
import { getGreeting } from "@/utils/date.utils";
import { getConsultationRouteForStatus } from "@/utils/navigation.utils";
import {
  canStartRecording,
  isConsultationCompleted,
} from "@/utils/session-status.utils";
import type { DoctorQueueItem } from "@/types/encounter.types";
import { colors, spacing, typography } from "@/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { items, sessions, isLoading, isError, refetch, isRefetching } =
    useDoctorQueue();
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  const completed = sessions.filter((s) =>
    isConsultationCompleted(s.status),
  ).length;
  const pending = sessions.filter(
    (s) =>
      canStartRecording(s.status) && !isConsultationCompleted(s.status),
  ).length;
  const upcoming = items.filter(
    (item) =>
      item.kind === "ip_encounter" ||
      item.session?.status === "created" ||
      item.status === "created",
  );

  const openQueueItem = async (item: DoctorQueueItem) => {
    const key = getQueueItemKey(item);
    if (openingKey) return;

    if (item.kind === "ip_encounter" && item.allRoundsCompletedToday) {
      Alert.alert(
        "Rounds complete",
        "All scheduled rounds for this patient are done for today.",
      );
      return;
    }

    try {
      setOpeningKey(key);
      const sessionId = await resolveQueueSessionId(item);
      if (!sessionId) {
        Alert.alert(
          "Unable to open",
          "Could not start or find a consultation for this patient.",
        );
        return;
      }

      const status = item.session?.status || "created";
      router.push(getConsultationRouteForStatus(sessionId, status) as never);
    } catch {
      Alert.alert(
        "Unable to open",
        "Failed to open this consultation. Please try again.",
      );
    } finally {
      setOpeningKey(null);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.doctorName}>{getDoctorDisplayName(user)}</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            <Avatar
              name={`${user?.firstName || ""} ${user?.lastName || ""}`}
              uri={user?.profilePicture}
              size={52}
            />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Today"
            value={String(items.length)}
            icon="calendar-outline"
            color={colors.primary}
            bg={colors.primaryLight}
          />
          <StatCard
            label="Pending"
            value={String(pending)}
            icon="hourglass-outline"
            color={colors.warning}
            bg={colors.warningLight}
          />
          <StatCard
            label="Done"
            value={String(completed)}
            icon="checkmark-circle-outline"
            color={colors.success}
            bg={colors.successLight}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Queue</Text>
          <Text style={styles.sectionCount}>{items.length}</Text>
        </View>

        {isLoading ? (
          <>
            <SkeletonCard />
            <View style={{ height: spacing.md }} />
            <SkeletonCard />
          </>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="medkit-outline"
            title="No consultations today"
            description="Create a patient or wait for assigned sessions to appear here."
          />
        ) : (
          items.map((item) => {
            const patient = getPatientFromQueueItem(item);
            if (!patient) return null;
            const key = getQueueItemKey(item);
            const subtitleParts = [
              getSessionDepartmentName(item.session),
              item.encounterType,
              item.ward && item.bed ? `${item.ward}/${item.bed}` : null,
              item.nextRoundLabel,
              item.kind === "ip_encounter" && item.allRoundsCompletedToday
                ? "Rounds done"
                : null,
            ].filter(Boolean);

            return (
              <PatientCard
                key={key}
                patient={patient}
                status={item.session?.status}
                time={item.session?.startedAt || item.session?.createdAt}
                subtitle={subtitleParts.join(" · ")}
                onPress={() => openQueueItem(item)}
              />
            );
          })
        )}

        {upcoming.length > 0 ? (
          <>
            <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              <Text style={styles.sectionTitle}>Ready / Upcoming</Text>
            </View>
            {upcoming.slice(0, 3).map((item) => {
              const patient = getPatientFromQueueItem(item);
              if (!patient) return null;
              return (
                <PatientCard
                  key={`up-${getQueueItemKey(item)}`}
                  patient={patient}
                  time={item.session?.startedAt || item.session?.createdAt}
                  subtitle={
                    item.kind === "ip_encounter"
                      ? item.nextRoundLabel || "IP round"
                      : "Ready to start"
                  }
                  onPress={() => openQueueItem(item)}
                />
              );
            })}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          <QuickAction
            icon="person-add-outline"
            label="New Patient"
            onPress={() => router.push("/create-patient" as never)}
          />
          <QuickAction
            icon="people-outline"
            label="Patients"
            onPress={() => router.push("/(tabs)/patients")}
          />
          <QuickAction
            icon="time-outline"
            label="History"
            onPress={() => router.push("/(tabs)/history")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}) {
  return (
    <Card style={styles.statCard} elevated={false}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    gap: spacing.sm,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  greetingText: { flex: 1, gap: 2 },
  greeting: { ...typography.caption, color: colors.muted },
  doctorName: { ...typography.title, color: colors.foreground, fontSize: 26 },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, alignItems: "flex-start", gap: spacing.xs },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: { ...typography.heading, color: colors.foreground },
  statLabel: { ...typography.caption, color: colors.muted },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  sectionCount: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
  },
});

import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";
import { useTenantScope } from "@/hooks/useTenantScope";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import {
  formatAppointmentStatus,
  getAppointmentPatient,
} from "@/types/appointment.types";
import { getPatientFullName } from "@/utils/patient.utils";
import { formatAppointmentWhen, formatTime } from "@/utils/date.utils";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { colors, spacing, typography } from "@/theme";

type ScheduleView = "today" | "upcoming" | "week";

function getLocalWeekRangeIso() {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = dayStart.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: fmt(weekStart), dateTo: fmt(weekEnd) };
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { organizationId } = useTenantScope();
  const { canViewAppointments } = useAccessControl();
  const doctorId = String(user?.id || user?._id || "");
  const [view, setView] = useState<ScheduleView>("today");
  const weekRange = useMemo(() => getLocalWeekRangeIso(), []);

  const {
    appointments,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAppointments({
    doctorId,
    organizationId,
    today: view === "today",
    upcoming: view === "upcoming",
    dateFrom: view === "week" ? weekRange.dateFrom : undefined,
    dateTo: view === "week" ? weekRange.dateTo : undefined,
    limit: 50,
    enabled:
      canViewAppointments() && Boolean(doctorId) && Boolean(organizationId),
  });

  const onAppointmentPress = (scheduledStart: string, patientName: string) => {
    const start = new Date(scheduledStart);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const aptDay = new Date(start);
    aptDay.setHours(0, 0, 0, 0);

    if (aptDay.getTime() > todayStart.getTime()) {
      Alert.alert(
        "Upcoming appointment",
        `${patientName} is scheduled for ${formatAppointmentWhen(scheduledStart)}. Check in from Consultations on that day.`,
      );
      return;
    }
    if (aptDay.getTime() < todayStart.getTime()) {
      Alert.alert("Past appointment", `${patientName} — past appointment.`);
      return;
    }
    Alert.alert(
      "Today",
      `${patientName} is scheduled today at ${formatTime(scheduledStart)}. Use the Consultations tab to check in.`,
    );
  };

  if (!canViewAppointments()) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <EmptyState
          title="Schedule unavailable"
          description="You do not have permission to view appointments."
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Schedule</Text>
      <View style={styles.tabs}>
        {(
          [
            { key: "today" as const, label: "Today" },
            { key: "week" as const, label: "This week" },
            { key: "upcoming" as const, label: "Upcoming" },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, view === tab.key && styles.tabActive]}
            onPress={() => setView(tab.key)}
          >
            <Text
              style={[styles.tabText, view === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id || item._id)}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No appointments"
              description="Nothing scheduled for this view."
            />
          }
          renderItem={({ item }) => {
            const patient = getAppointmentPatient(item);
            const name = patient ? getPatientFullName(patient) : "Patient";
            return (
              <Pressable
                onPress={() => onAppointmentPress(item.scheduledStart, name)}
              >
                <Card style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.time} numberOfLines={2}>
                      {view === "today"
                        ? formatTime(item.scheduledStart)
                        : formatAppointmentWhen(item.scheduledStart)}
                    </Text>
                  </View>
                  <Text style={styles.meta}>
                    {formatAppointmentStatus(item.status)}
                    {item.reason ? ` · ${item.reason}` : ""}
                  </Text>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  tabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tabText: { ...typography.caption, color: colors.muted, fontWeight: "600" },
  tabTextActive: { color: colors.primary },
  row: { marginBottom: spacing.sm, gap: 4 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { ...typography.bodyMedium, color: colors.foreground, flex: 1 },
  time: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "right",
    maxWidth: 130,
  },
  meta: { ...typography.caption, color: colors.muted },
});

import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing, typography } from "@/theme";
import type { DoctorDashboardStats } from "@/types/doctor-dashboard.types";

interface DoctorDashboardSummaryProps {
  stats?: DoctorDashboardStats;
  notesAwaitingReview: number;
  isLoading?: boolean;
  isError?: boolean;
}

const SUMMARY_ITEMS: Array<{
  key: keyof DoctorDashboardStats | "notesAwaitingReview";
  label: string;
  fallback?: number;
}> = [
  { key: "todayPatients", label: "Today" },
  { key: "weekPatients", label: "This week" },
  { key: "futureAppointments", label: "Upcoming" },
  { key: "notesAwaitingReview", label: "Notes to review" },
];

export function DoctorDashboardSummary({
  stats,
  notesAwaitingReview,
  isLoading,
  isError,
}: DoctorDashboardSummaryProps) {
  if (isLoading && !stats) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading clinic overview…</Text>
      </View>
    );
  }

  if (isError && !stats) {
    return null;
  }

  const resolveValue = (
    key: keyof DoctorDashboardStats | "notesAwaitingReview",
  ) => {
    if (key === "notesAwaitingReview") return notesAwaitingReview;
    const raw = stats?.[key];
    if (typeof raw === "number") return raw;
    return 0;
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Clinic overview</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {SUMMARY_ITEMS.map((item) => (
          <View key={item.key} style={styles.chip}>
            <Text style={styles.chipValue}>{resolveValue(item.key)}</Text>
            <Text style={styles.chipLabel}>{item.label}</Text>
          </View>
        ))}
        {stats ? (
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{stats.totalPatients}</Text>
            <Text style={styles.chipLabel}>Total patients</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  heading: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    minWidth: 96,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipValue: {
    ...typography.heading,
    color: colors.foreground,
    fontSize: 22,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: { ...typography.caption, color: colors.muted },
});

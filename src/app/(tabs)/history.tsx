import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";
import { useSessions } from "@/hooks/sessions/useSession";
import { useTenantScope } from "@/hooks/useTenantScope";
import { SearchInput } from "@/components/ui/SearchInput";
import { Chip } from "@/components/ui/Chip";
import { PatientCard } from "@/components/patients/PatientCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  getPatientFromSession,
  getSessionId,
} from "@/hooks/doctor/useDoctorQueue";
import { getConsultationRouteForStatus } from "@/utils/navigation.utils";
import { getSessionDepartmentName } from "@/types/session.types";
import { colors, spacing, typography } from "@/theme";

const FILTERS = [
  { key: "completed", label: "Completed" },
  { key: "ready_for_review", label: "Review" },
  { key: "all", label: "All" },
] as const;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { organizationId } = useTenantScope();
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["key"]>("completed");

  const doctorId = String(user?.id || user?._id || "");

  const queryFilters = useMemo(() => {
    const base: Record<string, unknown> = {
      organizationId,
      userId: doctorId,
      isActive: "true",
      search: search.trim() || undefined,
      page: 1,
      limit: 50,
    };
    if (filter !== "all") base.status = filter;
    return base;
  }, [organizationId, doctorId, search, filter]);

  const { data, isLoading, isError, refetch, isRefetching } = useSessions(
    queryFilters,
    Boolean(organizationId && doctorId),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search sessions…"
        />
        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={filter === item.key}
              onPress={() => setFilter(item.key)}
            />
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.listPad}>
          <SkeletonCard />
          <View style={{ height: 12 }} />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={data?.sessions || []}
          keyExtractor={(item) => getSessionId(item)}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No history yet"
              description="Completed consultations will show up here."
            />
          }
          renderItem={({ item }) => {
            const patient = getPatientFromSession(item);
            if (!patient) return null;
            const id = getSessionId(item);
            const departmentName = getSessionDepartmentName(item);
            return (
              <PatientCard
                patient={patient}
                status={item.status}
                time={item.completedAt || item.updatedAt || item.createdAt}
                subtitle={[departmentName, item.title].filter(Boolean).join(" · ")}
                onPress={() =>
                  router.push(
                    getConsultationRouteForStatus(id, item.status) as never,
                  )
                }
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.foreground, fontSize: 28 },
  filters: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  listPad: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    flexGrow: 1,
  },
});

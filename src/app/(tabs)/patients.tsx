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
import { usePatients } from "@/hooks/patients/usePatients";
import { useTenantScope } from "@/hooks/useTenantScope";
import { SearchInput } from "@/components/ui/SearchInput";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { PatientCard } from "@/components/patients/PatientCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { getPatientId } from "@/utils/patient.utils";
import type { Patient } from "@/types/patient.types";
import { colors, spacing, typography } from "@/theme";

export default function PatientsScreen() {
  const insets = useSafeAreaInsets();
  const { organizationId } = useTenantScope();
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({
      organizationId,
      search: search.trim() || undefined,
      isActive: "true",
      page: 1,
      limit: 50,
    }),
    [organizationId, search],
  );

  const { data, isLoading, isError, refetch, isRefetching } = usePatients(
    filters,
    Boolean(organizationId),
  );

  const onPatientPress = (patient: Patient) => {
    const id = getPatientId(patient);
    if (!id) return;
    router.push(`/patient/${id}` as never);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search patients…"
        />
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
          data={data?.patients || []}
          keyExtractor={(item) => item.id || item._id || item.patientCode}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No patients found"
              description="Create a patient to start a consultation."
            />
          }
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              showChevron
              onPress={() => onPatientPress(item)}
            />
          )}
        />
      )}

      <FloatingActionButton
        icon="person-add"
        onPress={() => router.push("/create-patient" as never)}
      />
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
  listPad: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    flexGrow: 1,
  },
});

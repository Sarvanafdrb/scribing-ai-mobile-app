import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { useMedicines } from "@/hooks/medicines/useMedicines";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useTenantScope } from "@/hooks/useTenantScope";
import type { Medicine } from "@/types/medicine.types";
import {
  formatMedicineSubtitle,
  getMedicineId,
} from "@/utils/medicine.utils";
import { colors, spacing, typography } from "@/theme";

function openMedicineDetail(medicine: Medicine) {
  const id = getMedicineId(medicine);
  if (!id) return;
  router.push(`/medicine/${id}` as never);
}

export default function MedicinesScreen() {
  const insets = useSafeAreaInsets();
  const { organizationId } = useTenantScope();
  const { canCreateMedicine } = useAccessControl();
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({
      organizationId,
      search: search.trim() || undefined,
      isActive: "true",
      page: 1,
      limit: 100,
    }),
    [organizationId, search],
  );

  const { data, isLoading, isError, refetch, isRefetching } = useMedicines(
    filters,
    Boolean(organizationId),
  );

  const medicines = data?.medicines || [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <GlassHeader
        title="Medicines"
        showBack
        subtitle="Organization catalog"
        right={
          canCreateMedicine() ? (
            <Pressable
              onPress={() => router.push("/create-medicine" as never)}
              hitSlop={8}
              accessibilityLabel="Add medicine"
            >
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </Pressable>
          ) : null
        }
      />
      <View style={styles.searchWrap}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search medicines…"
        />
      </View>

      {isLoading ? (
        <View style={styles.listPad}>
          <SkeletonCard />
          <View style={{ height: spacing.md }} />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} title="Unable to load medicines" />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => getMedicineId(item)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="medkit-outline"
              title="No medicines found"
              description="Try a different search or ask an admin to add medicines in the web console."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openMedicineDetail(item)}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}`}
            >
              <Card style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.mutedLight}
                  />
                </View>
                {!item.isActive ? (
                  <Text style={styles.inactive}>Inactive</Text>
                ) : null}
                {formatMedicineSubtitle(item) ? (
                  <Text style={styles.subtitle}>
                    {formatMedicineSubtitle(item)}
                  </Text>
                ) : null}
                {item.indications?.length ? (
                  <Text style={styles.indications} numberOfLines={2}>
                    {item.indications.map((i) => i.name).join(", ")}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          )}
        />
      )}

      {canCreateMedicine() ? (
        <FloatingActionButton
          onPress={() => router.push("/create-medicine" as never)}
          style={{ bottom: insets.bottom + 24 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  listPad: { padding: spacing.xl },
  listContent: { paddingHorizontal: spacing.xl, gap: spacing.md },
  row: { gap: 4, marginBottom: spacing.sm },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: { ...typography.bodyMedium, color: colors.foreground, flex: 1 },
  inactive: { ...typography.caption, color: colors.danger },
  subtitle: { ...typography.caption, color: colors.muted },
  indications: { ...typography.caption, color: colors.mutedLight },
});

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/theme";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Patient } from "@/types/patient.types";
import type { SessionStatus } from "@/types/session.types";
import {
  getPatientAge,
  getPatientFullName,
  getPatientInitials,
} from "@/utils/patient.utils";
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS } from "@/constants/status";
import { formatHistoryWhen } from "@/utils/date.utils";

interface PatientCardProps {
  patient: Patient;
  subtitle?: string;
  status?: SessionStatus;
  time?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export function PatientCard({
  patient,
  subtitle,
  status,
  time,
  onPress,
  showChevron = false,
}: PatientCardProps) {
  const name = getPatientFullName(patient);
  const age = getPatientAge(patient);
  const statusColors = status ? SESSION_STATUS_COLORS[status] : null;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Avatar name={getPatientInitials(patient)} size={52} />
          <View style={styles.content}>
            <View style={styles.top}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {time ? (
                <Text style={styles.time} numberOfLines={2}>
                  {formatHistoryWhen(time)}
                </Text>
              ) : null}
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {[
                age !== null ? `${age} yrs` : null,
                patient.gender,
                patient.bloodGroup,
                patient.patientCode,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {status && statusColors ? (
              <Badge
                label={SESSION_STATUS_LABELS[status]}
                color={statusColors.text}
                backgroundColor={statusColors.bg}
                style={styles.badge}
              />
            ) : null}
          </View>
          {showChevron ? (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.mutedLight}
            />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.foreground,
    fontWeight: "700",
    flex: 1,
  },
  time: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "right",
    maxWidth: 120,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    textTransform: "capitalize",
  },
  subtitle: {
    ...typography.caption,
    color: colors.mutedLight,
  },
  badge: {
    marginTop: spacing.xs,
  },
});

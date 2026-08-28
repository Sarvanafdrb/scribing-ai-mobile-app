import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import type { AuthUser } from "@/types/auth.types";
import { getDoctorDisplayName, getUserOrganizationName } from "@/types/auth.types";

interface DoctorCardProps {
  user: AuthUser;
}

export function DoctorCard({ user }: DoctorCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar
          name={`${user.firstName} ${user.lastName}`}
          uri={user.profilePicture}
          size={64}
        />
        <View style={styles.content}>
          <Text style={styles.name}>{getDoctorDisplayName(user)}</Text>
          {user.qualification ? (
            <Text style={styles.meta}>{user.qualification}</Text>
          ) : null}
          <Text style={styles.org}>{getUserOrganizationName(user)}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.heading,
    color: colors.foreground,
  },
  meta: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "600",
  },
  org: {
    ...typography.body,
    color: colors.muted,
  },
  email: {
    ...typography.caption,
    color: colors.mutedLight,
  },
});

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/theme";

export interface TimelineStep {
  key: string;
  label: string;
  status: "completed" | "current" | "pending" | "failed";
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const done = step.status === "completed";
        const current = step.status === "current";
        const failed = step.status === "failed";

        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  current && styles.dotCurrent,
                  failed && styles.dotFailed,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                ) : failed ? (
                  <Ionicons name="close" size={12} color={colors.white} />
                ) : null}
              </View>
              {!isLast ? (
                <View
                  style={[styles.line, done && styles.lineDone]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                (done || current) && styles.labelActive,
                failed && styles.labelFailed,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    minHeight: 44,
    gap: spacing.md,
  },
  rail: {
    width: 24,
    alignItems: "center",
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  dotDone: {
    backgroundColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
  },
  dotFailed: {
    backgroundColor: colors.danger,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: colors.success,
  },
  label: {
    ...typography.body,
    color: colors.mutedLight,
    paddingTop: 1,
    flex: 1,
  },
  labelActive: {
    color: colors.foreground,
    fontWeight: "600",
  },
  labelFailed: {
    color: colors.danger,
    fontWeight: "600",
  },
});

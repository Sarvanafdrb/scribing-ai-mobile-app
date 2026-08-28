import React from "react";
import { StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  label,
  color = colors.primary,
  backgroundColor = colors.primaryLight,
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: {
    ...typography.caption,
    fontWeight: "600",
    fontSize: 11,
  },
});

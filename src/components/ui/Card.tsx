import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { colors, radius, shadows, spacing } from "@/theme";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: boolean;
}

export function Card({
  children,
  style,
  padded = true,
  elevated = true,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  padded: {
    padding: spacing.lg,
  },
});

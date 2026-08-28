import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { colors, radius, spacing } from "@/theme";

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radius.sm,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
}) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [shimmer]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.45, 1]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.content}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={10} />
      <Skeleton width="55%" height={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
});

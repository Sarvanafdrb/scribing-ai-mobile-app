import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, radius } from "@/theme";

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = colors.primary,
  height = 8,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useSharedValue(clamped);

  React.useEffect(() => {
    width.value = withTiming(clamped, {
      duration: animated ? 400 : 0,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, animated, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: color, borderRadius: height / 2 },
          fillStyle,
        ]}
      />
    </View>
  );
}

interface IndeterminateProgressProps {
  color?: string;
  height?: number;
}

export function IndeterminateProgress({
  color = colors.primary,
  height = 4,
}: IndeterminateProgressProps) {
  const translate = useSharedValue(0);

  React.useEffect(() => {
    translate.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [translate]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translate.value * 180 - 60 }],
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2, overflow: "hidden" }]}>
      <Animated.View
        style={[
          {
            width: 80,
            height: "100%",
            backgroundColor: color,
            borderRadius: radius.full,
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});

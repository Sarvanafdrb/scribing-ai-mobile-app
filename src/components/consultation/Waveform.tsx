import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { colors } from "@/theme";

const BAR_COUNT = 28;

function WaveBar({
  index,
  active,
}: {
  index: number;
  active: boolean;
}) {
  const height = useSharedValue(8 + (index % 5) * 4);

  useEffect(() => {
    if (!active) {
      height.value = withTiming(10, { duration: 300 });
      return;
    }

    height.value = withDelay(
      index * 40,
      withRepeat(
        withTiming(18 + ((index * 7) % 36), {
          duration: 450 + (index % 4) * 80,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [active, height, index]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, style]} />;
}

interface WaveformProps {
  active?: boolean;
}

export function Waveform({ active = false }: WaveformProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, index) => (
        <WaveBar key={index} index={index} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
});

import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Waveform } from "@/components/consultation/Waveform";
import { useAudioRecorder } from "@/hooks/recording/useAudioRecorder";
import { useRecordingStore } from "@/store/recording.store";
import { formatDuration } from "@/utils/date.utils";
import { colors, spacing, typography } from "@/theme";

export default function RecordingScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const {
    state,
    elapsedSeconds,
    start,
    pause,
    resume,
    stop,
    isRecording,
    isPaused,
  } = useAudioRecorder(sessionId!);
  const setUploadProgress = useRecordingStore((s) => s.setUploadProgress);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(withTiming(1.25, { duration: 700 }), -1, true);
    } else {
      pulse.value = withTiming(1);
    }
  }, [isRecording, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  const handleStart = async () => {
    try {
      setBusy(true);
      await start();
    } catch (error: unknown) {
      Alert.alert(
        "Cannot start recording",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    try {
      setBusy(true);
      const result = await stop();
      if (!result?.uri) {
        Alert.alert("Recording failed", "No audio file was produced.");
        return;
      }
      setUploadProgress(0);
      router.replace({
        pathname: `/consultation/${sessionId}/uploading`,
        params: {
          uri: result.uri,
          duration: String(result.duration),
        },
      });
    } catch (error: unknown) {
      Alert.alert(
        "Stop failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GlassHeader title="Recording" showBack subtitle="Consultation audio" />
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
      >
        <View style={styles.indicatorRow}>
          <Animated.View style={[styles.liveDot, isRecording && pulseStyle]} />
          <Text style={styles.liveText}>
            {isRecording
              ? "Live recording"
              : isPaused
                ? "Paused"
                : state === "stopped"
                  ? "Stopped"
                  : "Ready to record"}
          </Text>
        </View>

        <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
        <Waveform active={isRecording} />

        <View style={styles.micWrap}>
          <View style={[styles.micRing, isRecording && styles.micRingActive]}>
            <Ionicons
              name="mic"
              size={40}
              color={isRecording ? colors.danger : colors.primary}
            />
          </View>
        </View>

        <View style={styles.controls}>
          {state === "idle" || state === "stopped" ? (
            <ControlButton
              icon="radio-button-on"
              label="Start"
              color={colors.danger}
              onPress={handleStart}
              disabled={busy}
            />
          ) : (
            <>
              <ControlButton
                icon={isPaused ? "play" : "pause"}
                label={isPaused ? "Resume" : "Pause"}
                color={colors.primary}
                onPress={isPaused ? resume : pause}
                disabled={busy}
              />
              <ControlButton
                icon="stop"
                label="Stop"
                color={colors.danger}
                onPress={handleStop}
                disabled={busy}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  color,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.control, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.controlBtn, { backgroundColor: color }]}>
        <Ionicons name={icon} size={28} color={colors.white} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  liveText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  timer: {
    fontSize: 52,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: 1,
  },
  micWrap: { marginVertical: spacing.lg },
  micRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  micRingActive: {
    backgroundColor: colors.dangerLight,
  },
  controls: {
    flexDirection: "row",
    gap: spacing["3xl"],
    marginTop: spacing.xl,
  },
  control: { alignItems: "center", gap: spacing.sm },
  controlBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "600",
  },
});

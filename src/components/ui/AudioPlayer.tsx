import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDuration } from "@/utils/date.utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface AudioPlayerProps {
  uri?: string | null;
  knownDuration?: number;
}

export function AudioPlayer({ uri, knownDuration }: AudioPlayerProps) {
  const player = useAudioPlayer(uri ?? null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    });
  }, []);

  const toggle = () => {
    if (!uri) return;
    if (!status.isLoaded && !status.error) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  if (!uri) return null;

  const position = status.currentTime || 0;
  const duration =
    status.duration && status.duration > 0
      ? status.duration
      : knownDuration && knownDuration > 0
        ? knownDuration
        : 0;
  const progress = duration > 0 ? position / duration : 0;
  const canPlay = status.isLoaded || Boolean(status.error);

  const errorMessage = status.error
    ? status.error.includes("code 4")
      ? "Recording format or URL not supported on this device. Pull to refresh the session."
      : status.error
    : null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggle}
        style={styles.playBtn}
        disabled={!canPlay && !status.isBuffering}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={20}
          color={colors.white}
        />
      </Pressable>
      <View style={styles.meta}>
        <ProgressBar progress={progress} height={6} />
        <Text style={styles.time}>
          {formatDuration(position)} / {formatDuration(duration)}
        </Text>
        {errorMessage ? (
          <Text style={styles.error} numberOfLines={3}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.muted,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});

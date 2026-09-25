import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDuration } from "@/utils/date.utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface AudioPlayerProps {
  uri?: string | null;
}

export function AudioPlayer({ uri }: AudioPlayerProps) {
  const player = useAudioPlayer(uri ?? null);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (!uri || !status.isLoaded) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  if (!uri) return null;

  const position = status.currentTime || 0;
  const duration = status.duration || 0;
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggle}
        style={styles.playBtn}
        disabled={!status.isLoaded && !status.isBuffering}
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
        {status.error ? (
          <Text style={styles.error} numberOfLines={2}>
            {status.error}
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

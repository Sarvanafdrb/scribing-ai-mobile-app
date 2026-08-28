import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { formatDuration } from "@/utils/date.utils";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface AudioPlayerProps {
  uri?: string | null;
}

export function AudioPlayer({ uri }: AudioPlayerProps) {
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [position, setPosition] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!uri) return;
      const { sound: nextSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        (status) => {
          if (!status.isLoaded || !mounted) return;
          setPosition(status.positionMillis / 1000);
          setDuration((status.durationMillis || 0) / 1000);
          setPlaying(status.isPlaying);
        },
      );
      if (mounted) setSound(nextSound);
    };

    load();

    return () => {
      mounted = false;
      sound?.unloadAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  const toggle = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  if (!uri) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <Pressable onPress={toggle} style={styles.playBtn}>
        <Ionicons
          name={playing ? "pause" : "play"}
          size={20}
          color={colors.white}
        />
      </Pressable>
      <View style={styles.meta}>
        <ProgressBar progress={progress} height={6} />
        <Text style={styles.time}>
          {formatDuration(position)} / {formatDuration(duration)}
        </Text>
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
});

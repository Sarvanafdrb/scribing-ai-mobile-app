import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { recordingService } from "@/services/recording.service";
import { resolveMediaUrl } from "@/utils/media.utils";
import { getApiErrorMessage } from "@/utils/apiError.utils";
import { colors, spacing, typography } from "@/theme";

interface SessionRecordingPlayerProps {
  sessionId: string;
  audioUrl?: string | null;
  audioPlaybackUrl?: string | null;
  knownDuration?: number | null;
}

function isPlayableDirectUrl(value?: string | null) {
  if (!value) return false;
  if (value.startsWith("s3://")) return false;
  return true;
}

export function SessionRecordingPlayer({
  sessionId,
  audioUrl,
  audioPlaybackUrl,
  knownDuration,
}: SessionRecordingPlayerProps) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!audioUrl && !audioPlaybackUrl) {
        setLoading(false);
        setUri(null);
        return;
      }

      setLoading(true);
      setError(null);
      setUri(null);

      try {
        const result = await recordingService.getPlaybackUrl(sessionId);
        const resolved = resolveMediaUrl(result.playbackUrl);
        if (!resolved) {
          throw new Error("Recording URL is unavailable.");
        }
        if (active) setUri(resolved);
      } catch (apiError) {
        const fallback = isPlayableDirectUrl(audioPlaybackUrl)
          ? audioPlaybackUrl
          : isPlayableDirectUrl(audioUrl)
            ? audioUrl
            : null;

        if (fallback) {
          const resolved = resolveMediaUrl(fallback);
          if (resolved && active) {
            setUri(resolved);
            setError(null);
            return;
          }
        }

        if (active) {
          setError(
            getApiErrorMessage(apiError, "Could not load recording for playback."),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [sessionId, audioUrl, audioPlaybackUrl]);

  if (!audioUrl && !audioPlaybackUrl) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading recording…</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!uri) {
    return (
      <Text style={styles.error}>No recording available for this visit.</Text>
    );
  }

  return (
    <AudioPlayer uri={uri} knownDuration={knownDuration ?? undefined} />
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: { ...typography.caption, color: colors.muted },
  error: { ...typography.caption, color: colors.danger },
});

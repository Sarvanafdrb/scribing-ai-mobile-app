import React, { useEffect, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { uploadRecording } from "@/services/upload.service";
import { sessionKeys } from "@/services/query-keys";
import { useRecordingStore } from "@/store/recording.store";
import { colors, spacing, typography } from "@/theme";

export default function UploadingScreen() {
  const { sessionId, uri, duration } = useLocalSearchParams<{
    sessionId: string;
    uri: string;
    duration: string;
  }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const progress = useRecordingStore((s) => s.uploadProgress);
  const setUploadProgress = useRecordingStore((s) => s.setUploadProgress);
  const resetRecording = useRecordingStore((s) => s.reset);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!sessionId || !uri) return;

    let cancelled = false;

    const run = async () => {
      try {
        setError(null);
        await uploadRecording(
          sessionId,
          uri,
          Number(duration || 0),
          setUploadProgress,
        );
        if (cancelled) return;
        await queryClient.invalidateQueries({
          queryKey: sessionKeys.detail(sessionId),
        });
        await queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
        resetRecording();
        router.replace(`/consultation/${sessionId}/processing`);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Upload failed. Please retry.",
        );
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    uri,
    duration,
    retryKey,
    setUploadProgress,
    queryClient,
    resetRecording,
  ]);

  return (
    <View style={styles.screen}>
      <GlassHeader title="Uploading" subtitle="Please keep this screen open" />
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
      >
        <Card style={styles.card}>
          <Text style={styles.title}>Uploading audio</Text>
          <Text style={styles.subtitle}>
            Your consultation recording is being securely uploaded. Do not close
            this screen.
          </Text>
          <ProgressBar progress={error ? 0 : progress} height={10} />
          <Text style={styles.percent}>
            {error ? "Failed" : `${Math.round(progress * 100)}%`}
          </Text>
          {error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              <Button
                title="Retry Upload"
                onPress={() => {
                  setError(null);
                  setUploadProgress(0);
                  setRetryKey((value) => value + 1);
                }}
              />
            </>
          ) : null}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: { gap: spacing.lg },
  title: { ...typography.heading, color: colors.foreground },
  subtitle: { ...typography.body, color: colors.muted },
  percent: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    textAlign: "right",
  },
  error: { ...typography.body, color: colors.danger },
});

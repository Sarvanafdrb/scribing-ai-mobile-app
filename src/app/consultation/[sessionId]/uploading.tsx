import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { uploadRecording } from "@/services/upload.service";
import { sessionService } from "@/services/session.service";
import { sessionKeys } from "@/services/query-keys";
import { useRecordingStore } from "@/store/recording.store";
import { colors, spacing, typography } from "@/theme";

const STALL_MS = 90 * 1000;

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
  const storeUri = useRecordingStore((s) => s.uri);
  const storeSessionId = useRecordingStore((s) => s.sessionId);
  const storeElapsed = useRecordingStore((s) => s.elapsedSeconds);
  const resetRecording = useRecordingStore((s) => s.reset);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const cancelledRef = useRef(false);
  const lastProgressRef = useRef(0);
  const lastProgressAtRef = useRef(Date.now());

  const audioUri = useMemo(() => {
    if (uri) return uri;
    if (storeSessionId === sessionId && storeUri) return storeUri;
    return null;
  }, [uri, sessionId, storeSessionId, storeUri]);

  const audioDuration = useMemo(() => {
    const fromParams = Number(duration || 0);
    if (fromParams > 0) return fromParams;
    if (storeSessionId === sessionId && storeElapsed > 0) return storeElapsed;
    return 0;
  }, [duration, sessionId, storeSessionId, storeElapsed]);

  const goBackFromUpload = () => {
    if (sessionId) {
      router.replace(`/consultation/${sessionId}/recording` as never);
      return;
    }
    router.back();
  };

  const confirmLeaveUpload = () => {
    if (error) {
      goBackFromUpload();
      return;
    }

    Alert.alert(
      "Stop upload?",
      "You can go back and record or try uploading again.",
      [
        { text: "Keep uploading", style: "cancel" },
        {
          text: "Go back",
          style: "destructive",
          onPress: () => {
            cancelledRef.current = true;
            void (async () => {
              if (sessionId) {
                try {
                  await sessionService.updateStatus(sessionId, "recording");
                  await queryClient.invalidateQueries({
                    queryKey: sessionKeys.detail(sessionId),
                  });
                } catch {
                  /* best effort */
                }
              }
              goBackFromUpload();
            })();
          },
        },
      ],
    );
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmLeaveUpload();
      return true;
    });
    return () => sub.remove();
  }, [error, sessionId]);

  useEffect(() => {
    if (progress > lastProgressRef.current) {
      lastProgressRef.current = progress;
      lastProgressAtRef.current = Date.now();
    }
  }, [progress]);

  useEffect(() => {
    if (error || !sessionId || !audioUri) return;

    const timer = setInterval(() => {
      if (cancelledRef.current) return;
      const stalledFor = Date.now() - lastProgressAtRef.current;
      if (stalledFor >= STALL_MS && progress < 0.99) {
        setError(
          "Upload is not progressing. Check your internet connection, then retry or go back.",
        );
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [audioUri, error, progress, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    if (!audioUri) {
      setError(
        "Recording file not found. Go back to the recording screen and stop again to upload.",
      );
      return;
    }

    cancelledRef.current = false;
    lastProgressRef.current = 0;
    lastProgressAtRef.current = Date.now();
    setUploadProgress(0.01);

    const run = async () => {
      try {
        setError(null);
        await uploadRecording(
          sessionId,
          audioUri,
          audioDuration,
          (value) => {
            lastProgressAtRef.current = Date.now();
            setUploadProgress(value);
          },
        );
        if (cancelledRef.current) return;
        await queryClient.invalidateQueries({
          queryKey: sessionKeys.detail(sessionId),
        });
        await queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
        resetRecording();
        router.replace(`/consultation/${sessionId}/processing`);
      } catch (err: unknown) {
        if (cancelledRef.current) return;
        setError(
          err instanceof Error ? err.message : "Upload failed. Please retry.",
        );
      }
    };

    void run();

    return () => {
      cancelledRef.current = true;
    };
  }, [
    sessionId,
    audioUri,
    audioDuration,
    retryKey,
    setUploadProgress,
    queryClient,
    resetRecording,
  ]);

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Uploading"
        subtitle={
          error ? "Upload needs attention" : "Please keep this screen open"
        }
        showBack
        onBack={confirmLeaveUpload}
      />
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
      >
        <Card style={styles.card}>
          <Text style={styles.title}>Uploading audio</Text>
          <Text style={styles.subtitle}>
            {error
              ? "Something went wrong or the upload stalled."
              : "Your consultation recording is being securely uploaded."}
          </Text>
          <ProgressBar progress={error ? 0 : progress} height={10} />
          <Text style={styles.percent}>
            {error ? "Failed" : `${Math.round(progress * 100)}%`}
          </Text>
          {error ? (
            <>
              <Text style={styles.error}>{error}</Text>
              {audioUri ? (
                <Button
                  title="Retry Upload"
                  onPress={() => {
                    setError(null);
                    setUploadProgress(0.01);
                    lastProgressAtRef.current = Date.now();
                    setRetryKey((value) => value + 1);
                  }}
                />
              ) : null}
              <Button
                title="Go Back"
                variant="outline"
                onPress={goBackFromUpload}
              />
            </>
          ) : (
            <Button
              title="Cancel upload"
              variant="outline"
              onPress={confirmLeaveUpload}
            />
          )}
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

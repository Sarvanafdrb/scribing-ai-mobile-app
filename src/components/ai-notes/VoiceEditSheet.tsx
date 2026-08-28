import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { aiNotesService } from "@/services/ai-notes.service";
import { useVoiceEditRecorder } from "@/hooks/recording/useVoiceEditRecorder";
import type { VoiceEditPreviewResult } from "@/types/ai-notes.types";
import { colors, spacing, typography } from "@/theme";

interface VoiceEditSheetProps {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
  onPreviewReady: (preview: VoiceEditPreviewResult) => void;
}

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export function VoiceEditSheet({
  visible,
  sessionId,
  onClose,
  onPreviewReady,
}: VoiceEditSheetProps) {
  const { state, elapsedSeconds, isRecording, start, stop, reset, setState } =
    useVoiceEditRecorder();
  const [processing, setProcessing] = useState(false);

  const handleClose = async () => {
    if (processing) return;
    await reset();
    onClose();
  };

  const handleStart = async () => {
    try {
      await start();
    } catch (error: unknown) {
      Alert.alert(
        "Microphone",
        (error as { message?: string })?.message ||
          "Allow microphone access and try again.",
      );
    }
  };

  const handleStopAndProcess = async () => {
    try {
      setProcessing(true);
      setState("processing");
      const result = await stop();
      if (!result?.uri) {
        Alert.alert("No audio", "No speech detected. Please record again.");
        setProcessing(false);
        setState("idle");
        return;
      }

      const preview = await aiNotesService.previewVoiceEdit(
        sessionId,
        result.uri,
        result.fileName,
        result.mimeType,
      );
      await reset();
      setProcessing(false);
      onPreviewReady(preview);
      onClose();
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Unable to process the voice instruction.";
      Alert.alert("Voice edit failed", message);
      setProcessing(false);
      setState("idle");
    }
  };

  return (
    <BottomSheet visible={visible} title="Voice Edit" onClose={handleClose}>
      <View style={styles.content}>
        <Text style={styles.help}>
          Speak a short instruction such as “Change diagnosis to Acute
          Pulpitis” or “Remove Amoxicillin”. Review changes before accepting.
        </Text>

        <View
          style={[
            styles.mic,
            isRecording ? styles.micRecording : styles.micIdle,
          ]}
        >
          <Ionicons
            name={processing ? "hourglass" : "mic"}
            size={36}
            color={colors.white}
          />
        </View>

        <Text style={styles.timer}>{formatTimer(elapsedSeconds)}</Text>
        <Text style={styles.status}>
          {processing
            ? "Processing instruction…"
            : isRecording
              ? "Listening… tap Stop & Process when done"
              : state === "stopped"
                ? "Ready to process"
                : "Ready to record"}
        </Text>

        <View style={styles.actions}>
          {!isRecording && !processing ? (
            <Button title="Start Recording" onPress={handleStart} />
          ) : null}
          {isRecording ? (
            <Button
              title="Stop & Process"
              loading={processing}
              onPress={handleStopAndProcess}
            />
          ) : null}
          <Button
            title="Cancel"
            variant="outline"
            disabled={processing}
            onPress={handleClose}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  help: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
  },
  mic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  micIdle: { backgroundColor: colors.primary },
  micRecording: { backgroundColor: colors.danger },
  timer: {
    ...typography.title,
    color: colors.foreground,
    fontVariant: ["tabular-nums"],
  },
  status: { ...typography.caption, color: colors.muted },
  actions: { width: "100%", gap: spacing.sm },
});

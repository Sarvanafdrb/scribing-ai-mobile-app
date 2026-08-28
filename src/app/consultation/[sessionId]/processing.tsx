import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { Card } from "@/components/ui/Card";
import { Timeline, TimelineStep } from "@/components/ui/Timeline";
import { IndeterminateProgress } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { LoadingScreen, ErrorState } from "@/components/ui/EmptyState";
import { useSession } from "@/hooks/sessions/useSession";
import { useTranscript } from "@/hooks/transcript/useTranscript";
import { useAiNotes } from "@/hooks/ai-notes/useAiNotes";
import { PROCESSING_STEPS } from "@/constants/status";
import {
  isReviewReady,
  isTranscriptAvailable,
} from "@/utils/session-status.utils";
import { colors, spacing, typography } from "@/theme";

export default function ProcessingScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { data: session, isLoading, isError, refetch } = useSession(sessionId);
  const { transcript } = useTranscript(sessionId);
  const { aiNotes, isGenerating } = useAiNotes(sessionId);

  useEffect(() => {
    if (!session) return;

    if (isReviewReady(session.status)) {
      router.replace(`/consultation/${sessionId}/notes`);
      return;
    }

    if (
      isTranscriptAvailable(session.status) &&
      session.status === "transcript_ready" &&
      !isGenerating &&
      aiNotes &&
      (aiNotes.subjective || aiNotes.assessment)
    ) {
      router.replace(`/consultation/${sessionId}/transcript`);
    }
  }, [session, sessionId, aiNotes, isGenerating]);

  const steps: TimelineStep[] = useMemo(() => {
    const status = session?.status;
    const notesStatus = aiNotes?.status;
    const transcriptDone = isTranscriptAvailable(status);
    const notesDone = isReviewReady(status);
    const failed = status === "failed" || notesStatus === "failed";

    const currentIndex = (() => {
      if (failed) return 2;
      if (notesDone) return 5;
      if (notesStatus === "processing" || isGenerating) {
        return aiNotes?.medications?.length ? 4 : 3;
      }
      if (transcriptDone) return 3;
      if (status === "processing") return 2;
      if (status === "uploading") return 1;
      return 0;
    })();

    return PROCESSING_STEPS.map((step, index) => {
      let stepStatus: TimelineStep["status"] = "pending";
      if (failed && index === currentIndex) stepStatus = "failed";
      else if (index < currentIndex) stepStatus = "completed";
      else if (index === currentIndex) stepStatus = "current";
      return { key: step.key, label: step.label, status: stepStatus };
    });
  }, [session?.status, aiNotes, isGenerating]);

  if (isLoading) return <LoadingScreen message="Preparing AI pipeline…" />;
  if (isError || !session) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Processing"
        subtitle="AI is generating transcript"
        showBack={session.status === "failed"}
      />
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
      >
        <Card style={styles.card}>
          <Text style={styles.title}>AI is working</Text>
          <Text style={styles.subtitle}>
            We&apos;re converting speech to text and preparing clinical notes.
          </Text>
          <IndeterminateProgress />
          <View style={styles.timeline}>
            <Timeline steps={steps} />
          </View>
          {transcript?.metadata?.status === "failed" ||
          session.status === "failed" ? (
            <Button
              title="Open Session"
              variant="outline"
              onPress={() => router.replace(`/consultation/${sessionId}`)}
            />
          ) : null}
          {isTranscriptAvailable(session.status) ? (
            <Button
              title="View Transcript"
              onPress={() =>
                router.replace(`/consultation/${sessionId}/transcript`)
              }
            />
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
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  card: { gap: spacing.lg },
  title: { ...typography.heading, color: colors.foreground },
  subtitle: { ...typography.body, color: colors.muted },
  timeline: { marginTop: spacing.sm },
});

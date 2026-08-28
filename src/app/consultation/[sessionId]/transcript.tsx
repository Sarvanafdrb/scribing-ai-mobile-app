import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingScreen, EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { useTranscript } from "@/hooks/transcript/useTranscript";
import { useTranscriptMutations } from "@/hooks/transcript/useTranscriptMutations";
import { useAiNotes } from "@/hooks/ai-notes/useAiNotes";
import { formatTimestamp } from "@/types/transcript.types";
import type { TranscriptSegment } from "@/types/transcript.types";
import { colors, radius, spacing, typography } from "@/theme";

type SpeakerFilter = "all" | "doctor" | "patient";

export default function TranscriptScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { transcript, isLoading, isError, refetch, isProcessing } =
    useTranscript(sessionId);
  const { update, generate } = useTranscriptMutations(sessionId);
  const { generate: generateNotes, isGenerating } = useAiNotes(sessionId);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SpeakerFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const segments = useMemo(() => {
    const list = transcript?.segments || [];
    return list.filter((segment) => {
      if (filter !== "all" && segment.speaker !== filter) return false;
      if (!search.trim()) return true;
      return segment.text.toLowerCase().includes(search.trim().toLowerCase());
    });
  }, [transcript?.segments, filter, search]);

  const saveSegment = async (segment: TranscriptSegment) => {
    if (!transcript) return;
    const nextSegments = transcript.segments.map((item) =>
      item.id === segment.id ? { ...item, text: draft } : item,
    );
    const fullText = nextSegments.map((item) => item.text).join(" ");
    try {
      await update.mutateAsync({ segments: nextSegments, fullText });
      setEditingId(null);
    } catch {
      Alert.alert("Save failed", "Could not update transcript segment.");
    }
  };

  const copyAll = async () => {
    await Clipboard.setStringAsync(transcript?.fullText || "");
    Alert.alert("Copied", "Transcript copied to clipboard.");
  };

  if (isLoading || isProcessing) {
    return <LoadingScreen message="Preparing transcript…" />;
  }

  if (isError) return <ErrorState onRetry={refetch} />;

  if (!transcript || !transcript.segments?.length) {
    return (
      <View style={styles.screen}>
        <GlassHeader title="Transcript" showBack />
        <EmptyState
          icon="document-text-outline"
          title="Transcript not ready"
          description="Generate or wait for transcription to complete."
          actionLabel="Regenerate"
          onAction={() => generate.mutate()}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Transcript"
        showBack
        right={
          <Pressable onPress={copyAll} hitSlop={10}>
            <Ionicons name="copy-outline" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <View style={styles.toolbar}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search transcript…"
        />
        <View style={styles.filters}>
          {(["all", "doctor", "patient"] as SpeakerFilter[]).map((item) => (
            <Chip
              key={item}
              label={item === "all" ? "All" : item === "doctor" ? "Doctor" : "Patient"}
              selected={filter === item}
              onPress={() => setFilter(item)}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 110 },
        ]}
      >
        {segments.map((segment) => {
          const isDoctor = segment.speaker === "doctor";
          const editing = editingId === segment.id;
          return (
            <Card
              key={segment.id}
              style={[
                styles.bubble,
                isDoctor ? styles.doctorBubble : styles.patientBubble,
              ]}
              elevated={false}
            >
              <View style={styles.bubbleHeader}>
                <Text style={styles.speaker}>
                  {isDoctor ? "Doctor" : segment.speaker === "patient" ? "Patient" : "Unknown"}
                </Text>
                <Text style={styles.time}>{formatTimestamp(segment.start)}</Text>
              </View>
              {editing ? (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  style={styles.editInput}
                  autoFocus
                />
              ) : (
                <Pressable
                  onLongPress={() => {
                    setEditingId(segment.id);
                    setDraft(segment.text);
                  }}
                >
                  <Text style={styles.text}>{segment.text}</Text>
                </Pressable>
              )}
              {editing ? (
                <View style={styles.editActions}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    fullWidth={false}
                    size="sm"
                    onPress={() => setEditingId(null)}
                  />
                  <Button
                    title="Save"
                    size="sm"
                    fullWidth={false}
                    loading={update.isPending}
                    onPress={() => saveSegment(segment)}
                  />
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerRow}>
          <View style={styles.footerBtn}>
            <Button
              title="Regenerate"
              variant="outline"
              loading={generate.isPending}
              onPress={() => generate.mutate()}
            />
          </View>
          <View style={styles.footerBtn}>
            <Button
              title="Generate AI Notes"
              loading={isGenerating || generateNotes.isPending}
              onPress={async () => {
                await generateNotes.mutateAsync(false);
                router.push(`/consultation/${sessionId}/notes`);
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  filters: { flexDirection: "row", gap: spacing.sm },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  bubble: { gap: spacing.xs },
  doctorBubble: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  patientBubble: { borderLeftWidth: 3, borderLeftColor: colors.secondary },
  bubbleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  speaker: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.foreground,
    textTransform: "uppercase",
  },
  time: { ...typography.caption, color: colors.mutedLight },
  text: { ...typography.body, color: colors.foreground },
  editInput: {
    ...typography.body,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.glass,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerRow: { flexDirection: "row", gap: spacing.md },
  footerBtn: { flex: 1 },
});

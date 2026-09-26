import React from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/ui/GlassHeader";
import { ConsultationRecordingControls } from "@/components/consultation/ConsultationRecordingControls";
import { safeRouterBack } from "@/utils/navigation.utils";
import { colors, spacing } from "@/theme";

export default function RecordingScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <GlassHeader
        title="Recording"
        showBack
        subtitle="Start · Pause · Stop"
        onBack={() =>
          safeRouterBack(`/consultation/${sessionId}` as never)
        }
      />
      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
      >
        <ConsultationRecordingControls sessionId={sessionId!} />
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
});

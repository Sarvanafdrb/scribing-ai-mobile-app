import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSessionSms } from "@/hooks/sms/useSessionSms";
import { getSmsStatusLabel } from "@/utils/sms.utils";
import {
  isValidIndianPhoneNumber,
  normalizeIndianPhoneNumber,
} from "@/utils/patient.utils";
import { isConsultationCompleted } from "@/utils/session-status.utils";
import type { Session } from "@/types/session.types";
import type { Patient } from "@/types/patient.types";
import { colors, spacing, typography } from "@/theme";

interface SessionSmsPanelProps {
  sessionId: string;
  session?: Session | null;
  patient?: Patient | null;
}

export function SessionSmsPanel({
  sessionId,
  session,
  patient,
}: SessionSmsPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { latestSms, sendSms, isSending } = useSessionSms(
    sessionId,
    Boolean(sessionId && session),
  );

  const patientPhone = useMemo(() => {
    const raw = patient?.phoneNumber?.trim() || "";
    return raw && raw !== "—" ? raw : "";
  }, [patient?.phoneNumber]);

  const canSend =
    Boolean(session) &&
    isConsultationCompleted(session?.status) &&
    Boolean(patientPhone) &&
    isValidIndianPhoneNumber(normalizeIndianPhoneNumber(patientPhone));

  const handlePress = () => {
    if (!isConsultationCompleted(session?.status)) {
      return;
    }

    if (!patientPhone) {
      return;
    }

    if (!isValidIndianPhoneNumber(normalizeIndianPhoneNumber(patientPhone))) {
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await sendSms();
      setConfirmOpen(false);
    } catch {
      setConfirmOpen(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Button
        title={`SMS to ${patientPhone || "patient"}`}
        variant="outline"
        size="sm"
        loading={isSending}
        disabled={!canSend || isSending}
        onPress={handlePress}
      />
      {!isConsultationCompleted(session.status) ? (
        <Text style={styles.hint}>
          Complete the consultation before sending SMS.
        </Text>
      ) : !patientPhone ? (
        <Text style={styles.hint}>No patient phone number on file.</Text>
      ) : !isValidIndianPhoneNumber(normalizeIndianPhoneNumber(patientPhone)) ? (
        <Text style={styles.hint}>Patient phone number is invalid.</Text>
      ) : null}
      {latestSms ? (
        <Text style={styles.status}>
          SMS status: {getSmsStatusLabel(latestSms.status)}
        </Text>
      ) : null}

      <ConfirmDialog
        visible={confirmOpen}
        title="Send patient SMS?"
        message={`Send consultation notification SMS to ${patientPhone}?`}
        confirmLabel="Send SMS"
        loading={isSending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirm()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    width: "100%",
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
  status: {
    ...typography.caption,
    color: colors.secondary,
  },
});

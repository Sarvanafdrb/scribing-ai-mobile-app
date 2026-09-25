import { useCallback, useEffect, useRef, useState } from "react";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder as useExpoAudioRecorder,
} from "expo-audio";
import type { AudioRecorder } from "expo-audio";

export type VoiceEditRecorderState =
  | "idle"
  | "recording"
  | "stopped"
  | "processing";

const safeStopRecorder = async (recorder: AudioRecorder) => {
  try {
    await recorder.stop();
    return recorder.uri;
  } catch {
    return null;
  }
};

export const useVoiceEditRecorder = () => {
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<VoiceEditRecorderState>("idle");
  const [state, setState] = useState<VoiceEditRecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setRecorderState = (next: VoiceEditRecorderState) => {
    stateRef.current = next;
    setState(next);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const reset = useCallback(async () => {
    clearTimer();
    if (stateRef.current === "recording") {
      await safeStopRecorder(recorder);
    }
    setRecorderState("idle");
    setElapsedSeconds(0);
    setUri(null);
    setError(null);
  }, [recorder]);

  const start = useCallback(async () => {
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Microphone permission is required.");
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: false,
    });

    await recorder.prepareToRecordAsync();
    recorder.record();
    setUri(null);
    setElapsedSeconds(0);
    setRecorderState("recording");
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [recorder]);

  const stop = useCallback(async () => {
    if (stateRef.current !== "recording") {
      return null;
    }
    clearTimer();
    const recordingUri = await safeStopRecorder(recorder);

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: false,
    });

    setUri(recordingUri);
    setRecorderState("stopped");
    return {
      uri: recordingUri,
      duration: elapsedSeconds,
      fileName: `voice-edit-${Date.now()}.m4a`,
      mimeType: "audio/m4a",
    };
  }, [elapsedSeconds, recorder]);

  return {
    state,
    elapsedSeconds,
    uri,
    error,
    setError,
    setState: setRecorderState,
    start,
    stop,
    reset,
    isRecording: state === "recording",
  };
};

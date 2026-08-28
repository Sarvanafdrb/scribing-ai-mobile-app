import { useCallback, useEffect, useRef, useState } from "react";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";

export type VoiceEditRecorderState =
  | "idle"
  | "recording"
  | "stopped"
  | "processing";

export const useVoiceEditRecorder = () => {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<VoiceEditRecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = useCallback(async () => {
    clearTimer();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // ignore cleanup errors
      }
      recordingRef.current = null;
    }
    setState("idle");
    setElapsedSeconds(0);
    setUri(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Microphone permission is required.");
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
    setUri(null);
    setElapsedSeconds(0);
    setState("recording");
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stop = useCallback(async () => {
    if (!recordingRef.current) return null;
    clearTimer();
    await recordingRef.current.stopAndUnloadAsync();
    const recordingUri = recordingRef.current.getURI();
    recordingRef.current = null;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    setUri(recordingUri);
    setState("stopped");
    return {
      uri: recordingUri,
      duration: elapsedSeconds,
      fileName: `voice-edit-${Date.now()}.m4a`,
      mimeType: "audio/m4a",
    };
  }, [elapsedSeconds]);

  return {
    state,
    elapsedSeconds,
    uri,
    error,
    setError,
    setState,
    start,
    stop,
    reset,
    isRecording: state === "recording",
  };
};

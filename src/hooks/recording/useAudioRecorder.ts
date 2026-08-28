import { useCallback, useEffect, useRef } from "react";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { useRecordingStore } from "@/store/recording.store";
import { recordingService } from "@/services/recording.service";

export const useAudioRecorder = (sessionId: string) => {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    state,
    elapsedSeconds,
    uri,
    setSessionId,
    setState,
    setElapsedSeconds,
    setUri,
    reset,
  } = useRecordingStore();

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      useRecordingStore.setState((prev) => ({
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
  };

  useEffect(() => {
    setSessionId(sessionId);
    return () => {
      clearTimer();
    };
  }, [sessionId, setSessionId]);

  const start = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Microphone permission is required to record.");
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

    await recordingService.start(sessionId);

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
    setUri(null);
    setElapsedSeconds(0);
    setState("recording");
    startTimer();
  }, [sessionId, setElapsedSeconds, setState, setUri]);

  const pause = useCallback(async () => {
    if (!recordingRef.current || state !== "recording") return;
    await recordingRef.current.pauseAsync();
    clearTimer();
    setState("paused");
  }, [setState, state]);

  const resume = useCallback(async () => {
    if (!recordingRef.current || state !== "paused") return;
    await recordingRef.current.startAsync();
    setState("recording");
    startTimer();
  }, [setState, state]);

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
      duration: useRecordingStore.getState().elapsedSeconds,
    };
  }, [setState, setUri]);

  return {
    state,
    elapsedSeconds,
    uri,
    start,
    pause,
    resume,
    stop,
    reset,
    isRecording: state === "recording",
    isPaused: state === "paused",
  };
};

import { create } from "zustand";
import type { RecordingState } from "@/types/recording.types";

interface RecordingStoreState {
  sessionId: string | null;
  state: RecordingState;
  elapsedSeconds: number;
  uri: string | null;
  uploadProgress: number;

  setSessionId: (sessionId: string | null) => void;
  setState: (state: RecordingState) => void;
  setElapsedSeconds: (seconds: number) => void;
  setUri: (uri: string | null) => void;
  setUploadProgress: (progress: number) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingStoreState>((set) => ({
  sessionId: null,
  state: "idle",
  elapsedSeconds: 0,
  uri: null,
  uploadProgress: 0,

  setSessionId: (sessionId) => set({ sessionId }),
  setState: (state) => set({ state }),
  setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),
  setUri: (uri) => set({ uri }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  reset: () =>
    set({
      sessionId: null,
      state: "idle",
      elapsedSeconds: 0,
      uri: null,
      uploadProgress: 0,
    }),
}));

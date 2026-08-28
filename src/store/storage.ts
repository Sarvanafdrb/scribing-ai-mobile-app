import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateStorage } from "zustand/middleware";

const memoryFallback = new Map<string, string>();

const secureStorageAdapter: StateStorage = {
  getItem: async (name) => {
    try {
      if (Platform.OS === "web") {
        return (await AsyncStorage.getItem(name)) ?? null;
      }
      return (await SecureStore.getItemAsync(name)) ?? null;
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem: async (name, value) => {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.setItem(name, value);
        return;
      }
      await SecureStore.setItemAsync(name, value);
    } catch {
      memoryFallback.set(name, value);
    }
  },
  removeItem: async (name) => {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.removeItem(name);
        return;
      }
      await SecureStore.deleteItemAsync(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

export const secureStorage = secureStorageAdapter;

export const asyncStorageAdapter: StateStorage = {
  getItem: async (name) => (await AsyncStorage.getItem(name)) ?? null,
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

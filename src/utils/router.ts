/**
 * Typed navigation helpers — Expo typed routes regenerate after first start.
 * Until then, cast keeps TS happy without weakening call sites elsewhere.
 */
import { router, Href } from "expo-router";

export const go = (path: string) => router.push(path as Href);
export const replace = (path: string) => router.replace(path as Href);

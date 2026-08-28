import { TextStyle } from "react-native";

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 41,
    letterSpacing: 0.3,
  } satisfies TextStyle,
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  heading: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 26,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  } satisfies TextStyle,
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  } satisfies TextStyle,
  button: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  } satisfies TextStyle,
} as const;

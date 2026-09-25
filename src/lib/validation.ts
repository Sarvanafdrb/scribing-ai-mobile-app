import { z } from "zod";
import {
  INDIAN_MOBILE_LENGTH,
  isValidIndianPhoneNumber,
  PATIENT_AGE_MAX,
  PATIENT_AGE_MIN,
} from "@/utils/patient.utils";

/** Organization name: letters, numbers, spaces, & - . ' ( ) */
export const ORGANIZATION_NAME_REGEX = /^[A-Za-z0-9&().'\-\s]+$/;

/** Strict production email local + domain */
export const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

/** Last name: letters, spaces, apostrophe, hyphen, period */
export const LAST_NAME_REGEX = /^[A-Za-z .'\-]+$/;

export const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters")
  .max(100, "Organization name must be at most 100 characters")
  .regex(
    ORGANIZATION_NAME_REGEX,
    "Organization name can only contain letters, numbers, spaces, and & - . ' ( )",
  );

export const strictEmailSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Email is required")
      .regex(STRICT_EMAIL_REGEX, "Please enter a valid email address")
      .refine((email) => !email.includes(".."), {
        message: "Please enter a valid email address",
      }),
  );

export const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Last name is required")
  .max(50, "Last name must be at most 50 characters")
  .regex(
    LAST_NAME_REGEX,
    "Last name can only contain letters, spaces, apostrophe, hyphen, and period",
  );

const refineIndianMobileDigits = (
  digits: string,
  ctx: z.RefinementCtx,
  allowEmpty: boolean,
) => {
  if (!digits) {
    if (!allowEmpty) {
      ctx.addIssue({
        code: "custom",
        message: "Phone number is required",
      });
    }
    return;
  }

  if (!/^\d+$/.test(digits)) {
    ctx.addIssue({
      code: "custom",
      message: "Phone number must contain digits only",
    });
    return;
  }

  if (digits.length !== INDIAN_MOBILE_LENGTH) {
    ctx.addIssue({
      code: "custom",
      message: `Phone number must be ${INDIAN_MOBILE_LENGTH} digits`,
    });
    return;
  }

  if (!isValidIndianPhoneNumber(digits)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a valid mobile number starting with 6, 7, 8, or 9",
    });
  }
};

/** Optional profile phone: exactly 10 digits, Indian mobile (starts with 6–9). */
export const optionalIndianMobileSchema = z
  .string()
  .optional()
  .superRefine((value, ctx) => {
    refineIndianMobileDigits((value ?? "").trim(), ctx, true);
  });

/** Required patient phone: exactly 10 digits, Indian mobile (starts with 6–9). */
export const requiredIndianMobileSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    refineIndianMobileDigits(value.trim(), ctx, false);
  });

/** Optional patient age: 1–120, digits only. */
export const optionalPatientAgeSchema = z
  .string()
  .optional()
  .superRefine((value, ctx) => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return;

    if (!/^\d+$/.test(trimmed)) {
      ctx.addIssue({
        code: "custom",
        message: "Age must be a whole number",
      });
      return;
    }

    const age = Number(trimmed);
    if (age < PATIENT_AGE_MIN || age > PATIENT_AGE_MAX) {
      ctx.addIssue({
        code: "custom",
        message: `Age must be between ${PATIENT_AGE_MIN} and ${PATIENT_AGE_MAX}`,
      });
    }
  });

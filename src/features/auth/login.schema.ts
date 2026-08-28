import { z } from "zod";
import { strictEmailSchema } from "@/lib/validation";

/** Same login schema as web `app/(auth)/login/page.tsx`. */
export const loginSchema = z.object({
  email: strictEmailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.url().transform((url) => new URL(url)),
  VITE_PUBLIC_POSTHOG_HOST: z.url(),
  VITE_PUBLIC_POSTHOG_KEY: z.string().min(1),
});

export const env = envSchema.parse(import.meta.env);

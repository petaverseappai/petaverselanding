import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().email(),
});

export type WaitlistFormValues = z.infer<typeof waitlistSchema>;

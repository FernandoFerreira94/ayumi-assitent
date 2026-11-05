import { z } from "zod";
import { MAX_CANDIDATES } from "./parse";

export const importInput = z
  .array(z.object({ name: z.string().trim().min(2).max(80), phone: z.string().regex(/^\+55\d{10,11}$/) }))
  .min(1)
  .max(MAX_CANDIDATES);

export const MAX_FILE_BYTES = 2 * 1024 * 1024;

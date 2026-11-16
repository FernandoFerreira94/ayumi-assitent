import { z } from "zod";
import { MAX_DEVICE_ROWS } from "@/features/native/device-contacts-core";
import { MAX_CANDIDATES } from "./parse";

export const importInput = z
  .array(
    z.object({
      name: z.string().trim().min(2).max(80),
      phone: z.string().regex(/^\+55\d{10,11}$/),
      email: z.email().max(200).optional(),
    }),
  )
  .min(1)
  .max(MAX_CANDIDATES);

export const MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Linhas cruas da agenda do celular (app da loja); o servidor normaliza como no arquivo. */
export const deviceInput = z
  .array(
    z.object({
      name: z.string().max(200),
      phone: z.string().max(40),
      email: z.string().max(200).optional(),
    }),
  )
  .max(MAX_DEVICE_ROWS);

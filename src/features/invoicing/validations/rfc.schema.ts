import { z } from "zod";

export const rfcSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/, "RFC inválido");

import { z } from 'zod';

export const compararQuerySchema = z.object({
  a: z.coerce.number().int().positive(),
  b: z.coerce.number().int().positive(),
});

export type CompararQuery = z.infer<typeof compararQuerySchema>;

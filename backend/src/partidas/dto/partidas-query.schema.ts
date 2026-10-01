import { z } from 'zod';
import { StatusPartida } from '@prisma/client';

export const partidasQuerySchema = z.object({
  clubeId: z.coerce.number().int().positive().optional(),
  status: z.enum(StatusPartida).optional(),
  competicao: z.string().min(1).optional(),
});

export type PartidasQuery = z.infer<typeof partidasQuerySchema>;

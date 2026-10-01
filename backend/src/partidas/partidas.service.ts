import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PartidasQuery } from './dto/partidas-query.schema.js';

@Injectable()
export class PartidasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: PartidasQuery) {
    const where: Prisma.PartidaWhereInput = {};

    if (filtros.clubeId) {
      where.OR = [{ mandanteId: filtros.clubeId }, { visitanteId: filtros.clubeId }];
    }
    if (filtros.status) {
      where.status = filtros.status;
    }
    if (filtros.competicao) {
      where.competicao = { contains: filtros.competicao, mode: 'insensitive' };
    }

    return this.prisma.partida.findMany({
      where,
      include: { mandante: true, visitante: true },
      orderBy: { dataHora: 'desc' },
    });
  }
}

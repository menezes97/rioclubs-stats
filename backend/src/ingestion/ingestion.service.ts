import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StatusPartida } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizarCompeticao } from '../common/competicoes.js';
import { FootballApiService, type PartidaApi } from './football-api.service.js';

export interface ResultadoIngestao {
  sucesso: boolean;
  partidasProcessadas: number;
  mensagem?: string;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly footballApi: FootballApiService,
  ) {}

  @Cron(process.env.INGESTION_CRON ?? '0 3 * * 0')
  async executarAgendado() {
    await this.executar();
  }

  async executar(): Promise<ResultadoIngestao> {
    try {
      const clubesAcompanhados = await this.prisma.clube.findMany({ where: { acompanhado: true } });
      let partidasProcessadas = 0;

      for (const clube of clubesAcompanhados) {
        const partidas = await this.footballApi.buscarPartidas(clube.nome);
        for (const partida of partidas) {
          await this.salvarPartida(partida);
          partidasProcessadas++;
        }
      }

      await this.prisma.ingestionLog.create({
        data: { sucesso: true, partidasInseridas: partidasProcessadas },
      });

      return { sucesso: true, partidasProcessadas };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido';
      this.logger.error(`Falha na ingestão: ${mensagem}`);

      await this.prisma.ingestionLog.create({
        data: { sucesso: false, partidasInseridas: 0, mensagem },
      });

      return { sucesso: false, partidasProcessadas: 0, mensagem };
    }
  }

  private async salvarPartida(partida: PartidaApi) {
    const mandante = await this.garantirClube(partida.homeTeamId, partida.homeTeamName);
    const visitante = await this.garantirClube(partida.awayTeamId, partida.awayTeamName);

    const dados = {
      status: this.mapearStatus(partida.status),
      golsMandante: partida.homeTeamScore ?? null,
      golsVisitante: partida.awayTeamScore ?? null,
    };

    await this.prisma.partida.upsert({
      where: { apiFootballId: Number(partida.id) },
      update: dados,
      create: {
        ...dados,
        apiFootballId: Number(partida.id),
        competicao: normalizarCompeticao(partida.leagueName),
        temporada: new Date(partida.matchDate).getFullYear(),
        dataHora: new Date(partida.matchDate),
        mandanteId: mandante.id,
        visitanteId: visitante.id,
      },
    });
  }

  /** Cria o clube adversário com dados mínimos se ele ainda não existir — não mexe em quem já existe (preserva "acompanhado"). */
  private async garantirClube(apiFootballId: string, nome: string) {
    return this.prisma.clube.upsert({
      where: { apiFootballId: Number(apiFootballId) },
      update: {},
      create: { apiFootballId: Number(apiFootballId), nome },
    });
  }

  private mapearStatus(status: PartidaApi['status']): StatusPartida {
    if (status.cancelled) return StatusPartida.CANCELADA;
    if (status.finished) return StatusPartida.FINALIZADA;
    if (status.started) return StatusPartida.EM_ANDAMENTO;
    return StatusPartida.AGENDADA;
  }
}

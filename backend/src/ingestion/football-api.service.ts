import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';

export interface PartidaApi {
  id: string;
  leagueId: number;
  leagueName: string;
  matchDate: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamScore?: number;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamScore?: number;
  status: {
    started: boolean;
    finished: boolean;
    cancelled: boolean;
  };
}

@Injectable()
export class FootballApiService {
  private readonly logger = new Logger(FootballApiService.name);
  private readonly host = process.env.API_FOOTBALL_HOST ?? '';
  private readonly key = process.env.API_FOOTBALL_KEY ?? '';
  private readonly limiteMensal = Number(process.env.API_FOOTBALL_MONTHLY_LIMIT ?? 90);

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async buscarPartidas(nomeTime: string): Promise<PartidaApi[]> {
    const podeChamar = await this.reservarOrcamento();
    if (!podeChamar) {
      this.logger.warn(`Orçamento mensal de requisições esgotado — pulando busca de "${nomeTime}"`);
      return [];
    }

    const resposta = await firstValueFrom(
      this.http.get(`https://${this.host}/football-matches-search`, {
        params: { search: nomeTime },
        headers: {
          'x-rapidapi-host': this.host,
          'x-rapidapi-key': this.key,
        },
      }),
    );

    return resposta.data?.response?.suggestions ?? [];
  }

  /** Só chama a API externa se ainda houver cota no orçamento mensal; já reserva a chamada de forma atômica. */
  private async reservarOrcamento(): Promise<boolean> {
    const mes = new Date().toISOString().slice(0, 7); // "AAAA-MM"
    const registro = await this.prisma.usoApiExterna.findUnique({ where: { mes } });

    if (registro && registro.contagem >= this.limiteMensal) {
      return false;
    }

    await this.prisma.usoApiExterna.upsert({
      where: { mes },
      update: { contagem: { increment: 1 } },
      create: { mes, contagem: 1 },
    });

    return true;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Partida, StatusPartida } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { SERIE_A } from '../common/competicoes.js';

/** Gols a favor/contra e resultado (V/E/D) de uma partida, do ponto de vista de um clube específico. */
function perspectivaDoClube(partida: Partida, clubeId: number) {
  const golsMandante = partida.golsMandante ?? 0;
  const golsVisitante = partida.golsVisitante ?? 0;
  const golsPro = partida.mandanteId === clubeId ? golsMandante : golsVisitante;
  const golsContra = partida.mandanteId === clubeId ? golsVisitante : golsMandante;
  const resultado: 'V' | 'E' | 'D' = golsPro > golsContra ? 'V' : golsPro < golsContra ? 'D' : 'E';
  return { golsPro, golsContra, resultado };
}

@Injectable()
export class ClubesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.clube.findMany({
      where: { acompanhado: true },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: number) {
    const clube = await this.prisma.clube.findUnique({ where: { id } });
    if (!clube) {
      throw new NotFoundException(`Clube ${id} não encontrado`);
    }
    return clube;
  }

  async compararCabecaACabeca(aId: number, bId: number) {
    const [clubeA, clubeB] = await Promise.all([this.buscarPorId(aId), this.buscarPorId(bId)]);

    const partidas = await this.prisma.partida.findMany({
      where: {
        status: StatusPartida.FINALIZADA,
        OR: [
          { mandanteId: aId, visitanteId: bId },
          { mandanteId: bId, visitanteId: aId },
        ],
      },
      orderBy: { dataHora: 'desc' },
    });

    let vitoriasA = 0;
    let vitoriasB = 0;
    let empates = 0;
    let golsA = 0;
    let golsB = 0;

    for (const partida of partidas) {
      const golsMandante = partida.golsMandante ?? 0;
      const golsVisitante = partida.golsVisitante ?? 0;
      const golsDoA = partida.mandanteId === aId ? golsMandante : golsVisitante;
      const golsDoB = partida.mandanteId === bId ? golsMandante : golsVisitante;

      golsA += golsDoA;
      golsB += golsDoB;

      if (golsDoA > golsDoB) vitoriasA++;
      else if (golsDoB > golsDoA) vitoriasB++;
      else empates++;
    }

    return {
      clubeA: { id: clubeA.id, nome: clubeA.nome, escudoUrl: clubeA.escudoUrl, corPrimaria: clubeA.corPrimaria },
      clubeB: { id: clubeB.id, nome: clubeB.nome, escudoUrl: clubeB.escudoUrl, corPrimaria: clubeB.corPrimaria },
      totalJogos: partidas.length,
      vitoriasA,
      vitoriasB,
      empates,
      golsA,
      golsB,
      partidas: partidas.map((p) => ({
        id: p.id,
        dataHora: p.dataHora,
        mandanteId: p.mandanteId,
        visitanteId: p.visitanteId,
        golsMandante: p.golsMandante,
        golsVisitante: p.golsVisitante,
      })),
    };
  }

  /** Tabela de classificação dos clubes acompanhados, calculada a partir dos jogos da Série A já ingeridos. */
  async classificacao() {
    const clubes = await this.prisma.clube.findMany({ where: { acompanhado: true } });

    const linhas = await Promise.all(
      clubes.map(async (clube) => {
        const partidas = await this.prisma.partida.findMany({
          where: {
            status: StatusPartida.FINALIZADA,
            competicao: SERIE_A,
            OR: [{ mandanteId: clube.id }, { visitanteId: clube.id }],
          },
        });

        let vitorias = 0;
        let empates = 0;
        let derrotas = 0;
        let golsPro = 0;
        let golsContra = 0;

        for (const partida of partidas) {
          const { golsPro: pro, golsContra: contra, resultado } = perspectivaDoClube(partida, clube.id);
          golsPro += pro;
          golsContra += contra;
          if (resultado === 'V') vitorias++;
          else if (resultado === 'D') derrotas++;
          else empates++;
        }

        return {
          clubeId: clube.id,
          nome: clube.nome,
          escudoUrl: clube.escudoUrl,
          corPrimaria: clube.corPrimaria,
          jogos: partidas.length,
          vitorias,
          empates,
          derrotas,
          golsPro,
          golsContra,
          saldoGols: golsPro - golsContra,
          pontos: vitorias * 3 + empates,
        };
      }),
    );

    return linhas.sort((a, b) => b.pontos - a.pontos || b.saldoGols - a.saldoGols || b.golsPro - a.golsPro);
  }

  /** Estatísticas de temporada de um clube (todas as competições), a partir dos jogos já ingeridos. */
  async estatisticasTemporada(id: number) {
    await this.buscarPorId(id);

    const partidas = await this.prisma.partida.findMany({
      where: {
        status: StatusPartida.FINALIZADA,
        OR: [{ mandanteId: id }, { visitanteId: id }],
      },
      orderBy: { dataHora: 'desc' },
    });

    let vitorias = 0;
    let empates = 0;
    let derrotas = 0;
    let golsPro = 0;
    let golsContra = 0;
    let jogosSemSofrerGols = 0;

    for (const partida of partidas) {
      const { golsPro: pro, golsContra: contra, resultado } = perspectivaDoClube(partida, id);
      golsPro += pro;
      golsContra += contra;
      if (contra === 0) jogosSemSofrerGols++;
      if (resultado === 'V') vitorias++;
      else if (resultado === 'D') derrotas++;
      else empates++;
    }

    const jogos = partidas.length;
    const pontos = vitorias * 3 + empates;
    const aproveitamento = jogos > 0 ? Math.round((pontos / (jogos * 3)) * 100) : 0;
    const ultimosCinco = partidas.slice(0, 5).map((p) => perspectivaDoClube(p, id).resultado);

    return {
      jogos,
      vitorias,
      empates,
      derrotas,
      golsPro,
      golsContra,
      jogosSemSofrerGols,
      aproveitamento,
      ultimosCinco,
    };
  }
}

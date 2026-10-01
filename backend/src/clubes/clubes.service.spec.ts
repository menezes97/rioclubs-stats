import { Test, TestingModule } from '@nestjs/testing';
import { StatusPartida, type Clube, type Partida } from '@prisma/client';
import { ClubesService } from './clubes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

function clube(overrides: Partial<Clube>): Clube {
  return {
    id: 0,
    nome: '',
    apelido: null,
    escudoUrl: null,
    corPrimaria: null,
    cidade: null,
    acompanhado: false,
    apiFootballId: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function partida(overrides: Partial<Partida>): Partida {
  return {
    id: 0,
    apiFootballId: 0,
    competicao: 'Série A',
    temporada: 2026,
    rodada: null,
    dataHora: new Date(),
    status: StatusPartida.FINALIZADA,
    mandanteId: 0,
    visitanteId: 0,
    golsMandante: null,
    golsVisitante: null,
    estadio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ClubesService', () => {
  let service: ClubesService;
  const prisma = {
    clube: { findUnique: vi.fn(), findMany: vi.fn() },
    partida: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClubesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ClubesService);
  });

  describe('compararCabecaACabeca', () => {
    it('calcula vitórias, empates e gols do ponto de vista de cada clube', async () => {
      prisma.clube.findUnique
        .mockResolvedValueOnce(clube({ id: 1, nome: 'Fluminense' }))
        .mockResolvedValueOnce(clube({ id: 2, nome: 'Flamengo' }));

      prisma.partida.findMany.mockResolvedValue([
        partida({ id: 1, mandanteId: 1, visitanteId: 2, golsMandante: 2, golsVisitante: 1 }), // vitória do A
        partida({ id: 2, mandanteId: 2, visitanteId: 1, golsMandante: 0, golsVisitante: 0 }), // empate
        partida({ id: 3, mandanteId: 1, visitanteId: 2, golsMandante: 1, golsVisitante: 3 }), // vitória do B
      ]);

      const resultado = await service.compararCabecaACabeca(1, 2);

      expect(resultado.totalJogos).toBe(3);
      expect(resultado.vitoriasA).toBe(1);
      expect(resultado.vitoriasB).toBe(1);
      expect(resultado.empates).toBe(1);
      expect(resultado.golsA).toBe(3); // 2 + 0 + 1
      expect(resultado.golsB).toBe(4); // 1 + 0 + 3
    });

    it('lança 404 quando um dos clubes não existe', async () => {
      prisma.clube.findUnique.mockResolvedValue(null);

      await expect(service.compararCabecaACabeca(999, 2)).rejects.toThrow('Clube 999 não encontrado');
    });
  });

  describe('classificacao', () => {
    it('ordena por pontos e depois por saldo de gols', async () => {
      prisma.clube.findMany.mockResolvedValue([clube({ id: 1, nome: 'A' }), clube({ id: 2, nome: 'B' })]);

      prisma.partida.findMany
        .mockResolvedValueOnce([partida({ mandanteId: 1, visitanteId: 3, golsMandante: 2, golsVisitante: 0 })]) // A: vitória, 3 pts
        .mockResolvedValueOnce([partida({ mandanteId: 2, visitanteId: 3, golsMandante: 1, golsVisitante: 1 })]); // B: empate, 1 pt

      const linhas = await service.classificacao();

      expect(linhas[0].clubeId).toBe(1);
      expect(linhas[0].pontos).toBe(3);
      expect(linhas[1].clubeId).toBe(2);
      expect(linhas[1].pontos).toBe(1);
    });
  });

  describe('estatisticasTemporada', () => {
    it('calcula aproveitamento e sequência dos últimos jogos', async () => {
      prisma.clube.findUnique.mockResolvedValue(clube({ id: 1, nome: 'Fluminense' }));

      // 2 vitórias, 1 empate, 1 derrota => 7 pontos de 12 possíveis => 58%
      prisma.partida.findMany.mockResolvedValue([
        partida({ id: 4, mandanteId: 1, visitanteId: 2, golsMandante: 0, golsVisitante: 1, dataHora: new Date('2026-09-04') }), // D
        partida({ id: 3, mandanteId: 1, visitanteId: 2, golsMandante: 1, golsVisitante: 1, dataHora: new Date('2026-09-03') }), // E
        partida({ id: 2, mandanteId: 2, visitanteId: 1, golsMandante: 0, golsVisitante: 2, dataHora: new Date('2026-09-02') }), // V
        partida({ id: 1, mandanteId: 1, visitanteId: 2, golsMandante: 3, golsVisitante: 0, dataHora: new Date('2026-09-01') }), // V
      ]);

      const stats = await service.estatisticasTemporada(1);

      expect(stats.jogos).toBe(4);
      expect(stats.vitorias).toBe(2);
      expect(stats.empates).toBe(1);
      expect(stats.derrotas).toBe(1);
      expect(stats.aproveitamento).toBe(58); // Math.round(7 / 12 * 100)
      expect(stats.ultimosCinco).toEqual(['D', 'E', 'V', 'V']);
    });
  });
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface Clube {
  id: number;
  nome: string;
  apelido: string | null;
  escudoUrl: string | null;
  corPrimaria: string | null;
  cidade: string | null;
  acompanhado: boolean;
}

export type StatusPartida = 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';

export interface Partida {
  id: number;
  competicao: string;
  dataHora: string;
  status: StatusPartida;
  golsMandante: number | null;
  golsVisitante: number | null;
  mandante: Clube;
  visitante: Clube;
}

export interface Comparacao {
  clubeA: { id: number; nome: string; escudoUrl: string | null; corPrimaria: string | null };
  clubeB: { id: number; nome: string; escudoUrl: string | null; corPrimaria: string | null };
  totalJogos: number;
  vitoriasA: number;
  vitoriasB: number;
  empates: number;
  golsA: number;
  golsB: number;
}

export interface LinhaClassificacao {
  clubeId: number;
  nome: string;
  escudoUrl: string | null;
  corPrimaria: string | null;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
  pontos: number;
}

export interface EstatisticasTemporada {
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  jogosSemSofrerGols: number;
  aproveitamento: number;
  ultimosCinco: ('V' | 'E' | 'D')[];
}

async function buscar<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, { cache: 'no-store' });
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar ${caminho}: ${resposta.status}`);
  }
  return resposta.json();
}

export const api = {
  listarClubes: () => buscar<Clube[]>('/clubes'),
  buscarClube: (id: number) => buscar<Clube>(`/clubes/${id}`),
  listarPartidas: (clubeId: number) => buscar<Partida[]>(`/partidas?clubeId=${clubeId}`),
  comparar: (a: number, b: number) => buscar<Comparacao>(`/clubes/compare?a=${a}&b=${b}`),
  classificacao: () => buscar<LinhaClassificacao[]>('/clubes/classificacao'),
  estatisticasTemporada: (clubeId: number) => buscar<EstatisticasTemporada>(`/clubes/${clubeId}/estatisticas`),
};

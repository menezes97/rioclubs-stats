export const SERIE_A = 'Série A';

const CANONICAS: Record<string, string> = {
  'serie a': SERIE_A,
  'serie b': 'Série B',
};

/** A API externa retorna o nome da competição com grafia inconsistente (ex.: "Serie A" x "Série A")
 * para o mesmo campeonato — normaliza para a forma canônica antes de persistir. */
export function normalizarCompeticao(nomeOriginal: string): string {
  const semAcento = nomeOriginal
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  return CANONICAS[semAcento] ?? nomeOriginal;
}

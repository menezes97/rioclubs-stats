import { normalizarCompeticao, SERIE_A } from './competicoes.js';

describe('normalizarCompeticao', () => {
  it('normaliza "Serie A" (sem acento) para a forma canônica', () => {
    expect(normalizarCompeticao('Serie A')).toBe(SERIE_A);
  });

  it('normaliza "Serie B" (sem acento) para a forma canônica', () => {
    expect(normalizarCompeticao('Serie B')).toBe('Série B');
  });

  it('mantém "Série A" (já na forma canônica) inalterado', () => {
    expect(normalizarCompeticao('Série A')).toBe(SERIE_A);
  });

  it('não mexe em outras competições', () => {
    expect(normalizarCompeticao('Copa Libertadores')).toBe('Copa Libertadores');
    expect(normalizarCompeticao('Copa do Brasil')).toBe('Copa do Brasil');
  });
});

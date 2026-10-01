import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';

const LIMITE_PROXIMOS = 5;
const LIMITE_RESULTADOS = 10;

function formatarData(dataHora: string) {
  return new Date(dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function resultado(golsMandante: number | null, golsVisitante: number | null) {
  if (golsMandante === null || golsVisitante === null) return '—';
  return `${golsMandante} - ${golsVisitante}`;
}

function TimeLink({ id, nome }: { id: number; nome: string }) {
  return (
    <Link href={`/clubes/${id}`} className="hover:text-emerald-400 hover:underline">
      {nome}
    </Link>
  );
}

function Competicao({ nome }: { nome: string }) {
  return (
    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[11px] whitespace-nowrap text-neutral-400">
      {nome}
    </span>
  );
}

const CORES_RESULTADO: Record<'V' | 'E' | 'D', string> = {
  V: 'bg-emerald-600',
  E: 'bg-neutral-600',
  D: 'bg-red-600',
};

function Estatistica({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-3 text-center">
      <p className="text-xs text-neutral-500">{rotulo}</p>
      <p className="text-lg font-bold">{valor}</p>
    </div>
  );
}

export default async function ClubeDetalhe({ params }: PageProps<'/clubes/[id]'>) {
  const { id } = await params;
  const clubeId = Number(id);

  const clube = await api.buscarClube(clubeId).catch(() => null);
  if (!clube) {
    notFound();
  }

  const [partidas, estatisticas] = await Promise.all([
    api.listarPartidas(clubeId),
    api.estatisticasTemporada(clubeId),
  ]);

  const proximosJogos = partidas
    .filter((p) => p.status === 'AGENDADA' || p.status === 'EM_ANDAMENTO')
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
    .slice(0, LIMITE_PROXIMOS);

  const resultadosRecentes = partidas.filter((p) => p.status === 'FINALIZADA').slice(0, LIMITE_RESULTADOS);

  return (
    <div>
      <Link href="/" className="text-sm text-neutral-400 hover:text-emerald-400">
        ← Clubes
      </Link>

      <div className="mt-2 mb-8 flex items-center gap-4">
        {clube.escudoUrl && (
          <Image src={clube.escudoUrl} alt={clube.nome} width={64} height={64} className="h-16 w-16 object-contain" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{clube.nome}</h1>
          {clube.apelido && <p className="text-neutral-400">{clube.apelido}</p>}
        </div>
        <span
          className="ml-auto h-3 w-16 rounded-full"
          style={{ backgroundColor: clube.corPrimaria ?? undefined }}
          aria-hidden
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Estatísticas da temporada</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Estatistica rotulo="Aproveitamento" valor={`${estatisticas.aproveitamento}%`} />
          <Estatistica rotulo="Gols pró" valor={estatisticas.golsPro} />
          <Estatistica rotulo="Gols contra" valor={estatisticas.golsContra} />
          <Estatistica rotulo="Sem sofrer gol" valor={estatisticas.jogosSemSofrerGols} />
        </div>
        {estatisticas.ultimosCinco.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            Últimos jogos:
            <span className="flex gap-1">
              {estatisticas.ultimosCinco.map((r, i) => (
                <span
                  key={i}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${CORES_RESULTADO[r]}`}
                >
                  {r}
                </span>
              ))}
            </span>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Próximos jogos</h2>
        {proximosJogos.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum jogo agendado no momento.</p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {proximosJogos.map((partida) => (
              <li key={partida.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <Competicao nome={partida.competicao} />
                <span className="flex-1">
                  <TimeLink id={partida.mandante.id} nome={partida.mandante.nome} /> x{' '}
                  <TimeLink id={partida.visitante.id} nome={partida.visitante.nome} />
                </span>
                <span className="text-neutral-400">{formatarData(partida.dataHora)}</span>
                {partida.status === 'EM_ANDAMENTO' && (
                  <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    Ao vivo
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Resultados recentes</h2>
        {resultadosRecentes.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum resultado registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {resultadosRecentes.map((partida) => (
              <li key={partida.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <Competicao nome={partida.competicao} />
                <span className="flex-1">
                  <TimeLink id={partida.mandante.id} nome={partida.mandante.nome} /> x{' '}
                  <TimeLink id={partida.visitante.id} nome={partida.visitante.nome} />
                </span>
                <span className="text-neutral-400">{formatarData(partida.dataHora)}</span>
                <span className="w-12 text-right font-medium">
                  {resultado(partida.golsMandante, partida.golsVisitante)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

export default async function Classificacao() {
  const linhas = await api.classificacao();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Classificação</h1>
      <p className="mb-6 text-sm text-neutral-500">Série A — calculada a partir dos jogos já registrados</p>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Clube</th>
              <th className="px-3 py-3 text-center font-medium">P</th>
              <th className="px-3 py-3 text-center font-medium">J</th>
              <th className="px-3 py-3 text-center font-medium">V</th>
              <th className="px-3 py-3 text-center font-medium">E</th>
              <th className="px-3 py-3 text-center font-medium">D</th>
              <th className="px-3 py-3 text-center font-medium">GP</th>
              <th className="px-3 py-3 text-center font-medium">GC</th>
              <th className="px-3 py-3 text-center font-medium">SG</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={linha.clubeId} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/clubes/${linha.clubeId}`} className="flex items-center gap-2 hover:text-emerald-400">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: linha.corPrimaria ?? undefined }} aria-hidden />
                    {linha.escudoUrl && (
                      <Image src={linha.escudoUrl} alt={linha.nome} width={20} height={20} className="h-5 w-5 object-contain" />
                    )}
                    <span className="font-medium">{linha.nome}</span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-center font-bold">{linha.pontos}</td>
                <td className="px-3 py-3 text-center text-neutral-400">{linha.jogos}</td>
                <td className="px-3 py-3 text-center text-neutral-400">{linha.vitorias}</td>
                <td className="px-3 py-3 text-center text-neutral-400">{linha.empates}</td>
                <td className="px-3 py-3 text-center text-neutral-400">{linha.derrotas}</td>
                <td className="px-3 py-3 text-center text-neutral-400">{linha.golsPro}</td>
                <td className="px-3 py-3 text-center text-neutral-400">{linha.golsContra}</td>
                <td className="px-3 py-3 text-center text-neutral-400">
                  {linha.saldoGols > 0 ? `+${linha.saldoGols}` : linha.saldoGols}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

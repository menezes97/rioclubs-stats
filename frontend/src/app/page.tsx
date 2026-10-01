import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

export default async function Home() {
  const clubes = await api.listarClubes();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Clubes acompanhados</h1>
      <ul className="grid gap-4 sm:grid-cols-2">
        {clubes.map((clube) => (
          <li key={clube.id}>
            <Link
              href={`/clubes/${clube.id}`}
              style={{ borderTopColor: clube.corPrimaria ?? undefined }}
              className="flex items-center gap-4 rounded-lg border border-neutral-800 border-t-4 p-4 transition hover:border-neutral-600"
            >
              {clube.escudoUrl && (
                <Image src={clube.escudoUrl} alt={clube.nome} width={48} height={48} className="h-12 w-12 object-contain" />
              )}
              <div>
                <p className="text-lg font-semibold">{clube.nome}</p>
                {clube.apelido && <p className="text-sm text-neutral-400">{clube.apelido}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { api } from '@/lib/api';
import { ComparadorClubes } from '@/components/ComparadorClubes';

export default async function Comparar() {
  const clubes = await api.listarClubes();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Comparar clubes</h1>
      <ComparadorClubes clubes={clubes} />
    </div>
  );
}

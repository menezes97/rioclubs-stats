'use client';

import Image from 'next/image';
import { useState } from 'react';
import { api, type Clube, type Comparacao } from '@/lib/api';

export function ComparadorClubes({ clubes }: { clubes: Clube[] }) {
  const [idA, setIdA] = useState(clubes[0]?.id);
  const [idB, setIdB] = useState(clubes[1]?.id);
  const [resultado, setResultado] = useState<Comparacao | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function comparar() {
    if (!idA || !idB || idA === idB) return;
    setCarregando(true);
    try {
      setResultado(await api.comparar(idA, idB));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <Seletor label="Clube A" valor={idA} clubes={clubes} onChange={setIdA} />
        <Seletor label="Clube B" valor={idB} clubes={clubes} onChange={setIdB} />
        <button
          onClick={comparar}
          disabled={!idA || !idB || idA === idB || carregando}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {carregando ? 'Comparando...' : 'Comparar'}
        </button>
      </div>

      {idA === idB && <p className="text-sm text-amber-400">Escolha dois clubes diferentes.</p>}

      {resultado && (
        <div className="rounded-lg border border-neutral-800 p-6">
          <div className="mb-6 flex items-center justify-center gap-6">
            <LadoClube clube={resultado.clubeA} />
            <span className="text-2xl font-bold text-neutral-600">x</span>
            <LadoClube clube={resultado.clubeB} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <Estatistica rotulo="Vitórias" a={resultado.vitoriasA} b={resultado.vitoriasB} />
            <Estatistica rotulo="Empates" a={resultado.empates} b={resultado.empates} />
            <Estatistica rotulo="Gols" a={resultado.golsA} b={resultado.golsB} />
          </div>
          <p className="mt-4 text-center text-xs text-neutral-500">
            {resultado.totalJogos} confronto(s) direto(s) considerado(s)
          </p>
        </div>
      )}
    </div>
  );
}

function LadoClube({ clube }: { clube: Comparacao['clubeA'] }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {clube.escudoUrl && <Image src={clube.escudoUrl} alt={clube.nome} width={56} height={56} className="h-14 w-14 object-contain" />}
      <span className="text-sm font-semibold">{clube.nome}</span>
      <span className="h-1 w-10 rounded-full" style={{ backgroundColor: clube.corPrimaria ?? undefined }} aria-hidden />
    </div>
  );
}

function Seletor({
  label,
  valor,
  clubes,
  onChange,
}: {
  label: string;
  valor: number | undefined;
  clubes: Clube[];
  onChange: (id: number) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-neutral-400">{label}</span>
      <select
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
      >
        {clubes.map((clube) => (
          <option key={clube.id} value={clube.id}>
            {clube.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

function Estatistica({ rotulo, a, b }: { rotulo: string; a: number; b: number }) {
  return (
    <div>
      <p className="text-neutral-500">{rotulo}</p>
      <p className="font-medium">
        {a} - {b}
      </p>
    </div>
  );
}

export default function Carregando() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg border border-neutral-800 bg-neutral-900" />
      ))}
    </div>
  );
}

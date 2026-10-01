export default function Carregando() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-4 w-16 rounded bg-neutral-800" />
      <div className="mt-2 mb-8 flex items-center gap-4">
        <div className="h-16 w-16 rounded bg-neutral-800" />
        <div className="h-6 w-40 rounded bg-neutral-800" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 rounded bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}

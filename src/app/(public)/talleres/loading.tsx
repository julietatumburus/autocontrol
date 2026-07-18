export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-12">
      <div className="h-9 w-40 rounded-lg bg-slate-200" />
      <div className="mt-4 h-11 max-w-xl rounded-lg bg-slate-200" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

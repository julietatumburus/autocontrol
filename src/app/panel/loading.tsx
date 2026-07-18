export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-52 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-slate-200" />
    </div>
  );
}

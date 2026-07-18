export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

function ProposalCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="h-4 w-24 rounded bg-slate-800" />
      <div className="mt-4 h-7 w-3/4 rounded bg-slate-800" />
      <div className="mt-5 h-4 w-full rounded bg-slate-800" />
      <div className="mt-3 h-4 w-5/6 rounded bg-slate-800" />
      <div className="mt-6 h-10 w-full rounded bg-slate-800" />
    </div>
  );
}

export default function ProposalsLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-widest text-cyan-400">
          Discover
        </p>

        <h1 className="mt-2 text-4xl font-bold">Loading proposals</h1>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ProposalCardSkeleton />
          <ProposalCardSkeleton />
          <ProposalCardSkeleton />
        </div>
      </div>
    </main>
  );
}

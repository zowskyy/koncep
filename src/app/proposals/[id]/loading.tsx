export default function ProposalDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-800" />
        <div className="mt-10 h-4 w-28 rounded bg-slate-800" />
        <div className="mt-4 h-12 w-4/5 rounded bg-slate-800" />
        <div className="mt-6 h-7 w-2/3 rounded bg-slate-800" />

        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-8">
          <div className="h-8 w-56 rounded bg-slate-800" />
          <div className="mt-5 h-4 w-full rounded bg-slate-800" />
          <div className="mt-3 h-4 w-11/12 rounded bg-slate-800" />
          <div className="mt-3 h-4 w-4/5 rounded bg-slate-800" />

          <div className="mt-10 h-8 w-40 rounded bg-slate-800" />
          <div className="mt-5 h-4 w-32 rounded bg-slate-800" />
          <div className="mt-3 h-4 w-40 rounded bg-slate-800" />

          <div className="mt-10 h-12 w-44 rounded bg-slate-800" />
        </div>
      </div>
    </main>
  );
}

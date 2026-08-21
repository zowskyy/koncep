import Link from "next/link";

export default function ProposalNotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-sm uppercase tracking-widest text-cyan-400">
          Not found
        </p>

        <h1 className="mt-3 text-4xl font-bold">This proposal is unavailable</h1>

        <p className="mt-4 text-slate-300">
          It may have been removed, renamed, or the link may be incorrect.
        </p>

        <Link
          href="/proposals"
          className="mt-8 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
        >
          Browse proposals
        </Link>
      </div>
    </main>
  );
}

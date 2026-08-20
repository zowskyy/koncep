import Link from "next/link";
import { proposals } from "@/lib/domain/proposals";

export default function ProposalsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              Discover
            </p>
            <h1 className="mt-2 text-4xl font-bold">Project proposals</h1>
          </div>

          <Link
            href="/proposals/new"
            className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
          >
            New proposal
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => (
            <article
              key={proposal.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-sm text-cyan-400">{proposal.category}</p>

              <h2 className="mt-3 text-xl font-semibold">
                {proposal.title}
              </h2>

              <p className="mt-4 text-slate-300">{proposal.summary}</p>

              <p className="mt-4 text-sm text-slate-400">
                {proposal.supporters.toLocaleString()} supporters
              </p>

              <Link
                href={`/proposals/${proposal.id}`}
                className="mt-6 block rounded-lg border border-cyan-500 px-4 py-2 text-center text-cyan-300 hover:bg-cyan-500/10"
              >
                View proposal
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

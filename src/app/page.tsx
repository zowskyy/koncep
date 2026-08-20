import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-8 py-24">
        <p className="mb-4 text-sm uppercase tracking-widest text-cyan-400">
          Community Projects
        </p>

        <h1 className="max-w-4xl text-6xl font-bold tracking-tight">
          Turn shared ideas into real projects.
        </h1>

        <p className="mt-6 max-w-2xl text-xl text-slate-300">
          Propose ideas, find collaborators, gather community support, and
          build projects together.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/proposals"
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
          >
            Explore proposals
          </Link>

          <Link
            href="/proposals/new"
            className="rounded-lg border border-slate-600 px-5 py-3 font-semibold"
          >
            Propose an idea
          </Link>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

const proposals = [
  {
    title: "Open-source animation timeline editor",
    category: "Software",
    supporters: 1284,
    roles: ["TypeScript developer", "UX designer", "Documentation writer"]
  },
  {
    title: "Community-funded animated short",
    category: "Film and animation",
    supporters: 842,
    roles: ["Animator", "Composer", "Editor"]
  },
  {
    title: "Accessible community game controller",
    category: "Physical products",
    supporters: 419,
    roles: ["Hardware engineer", "Industrial designer", "Accessibility tester"]
  }
];

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
              key={proposal.title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-sm text-cyan-400">{proposal.category}</p>
              <h2 className="mt-3 text-xl font-semibold">{proposal.title}</h2>
              <p className="mt-4 text-slate-300">
                {proposal.supporters.toLocaleString()} supporters
              </p>

              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-200">
                  Needed roles
                </p>

                <ul className="mt-2 space-y-1 text-sm text-slate-400">
                  {proposal.roles.map((role) => (
                    <li key={role}>• {role}</li>
                  ))}
                </ul>
              </div>

              <button className="mt-6 w-full rounded-lg border border-cyan-500 px-4 py-2 text-cyan-300 hover:bg-cyan-500/10">
                Support proposal
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

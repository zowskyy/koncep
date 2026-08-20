import Link from "next/link";
import { notFound } from "next/navigation";
import { SupportButton } from "@/components/projects/support-button";
import { getProposalById } from "@/lib/domain/proposals";

type ProposalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProposalDetailPage({
  params
}: ProposalPageProps) {
  const { id } = await params;
  const proposal = getProposalById(id);

  if (!proposal) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/proposals" className="text-cyan-400">
          ← Back to proposals
        </Link>

        <p className="mt-10 text-sm uppercase tracking-widest text-cyan-400">
          {proposal.category}
        </p>

        <h1 className="mt-3 text-5xl font-bold">{proposal.title}</h1>

        <p className="mt-6 text-xl text-slate-300">{proposal.summary}</p>

        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-2xl font-semibold">About this proposal</h2>

          <p className="mt-4 leading-8 text-slate-300">
            {proposal.description}
          </p>

          <h2 className="mt-10 text-2xl font-semibold">Needed roles</h2>

          <ul className="mt-4 space-y-2 text-slate-300">
            {proposal.neededRoles.map((role) => (
              <li key={role}>• {role}</li>
            ))}
          </ul>

          <div className="mt-10">
            <SupportButton initialCount={proposal.supporters} />
          </div>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SupportButton } from "@/components/projects/support-button";
import { SupportProgress } from "@/components/projects/support-progress";
import { StatusAdvanceButton } from "@/components/projects/status-advance-button";
import {
  getProposalById,
  listProposalEvents
} from "@/lib/server/proposals";
import { ProposalTimeline } from "@/components/projects/proposal-timeline";
import { getMemberId } from "@/lib/server/auth/member";
import { db } from "@/lib/server/db";
import { proposals } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";

type ProposalPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params
}: ProposalPageProps): Promise<Metadata> {
  const { id } = await params;
  const proposal = getProposalById(id);
  const events = listProposalEvents(id);

  if (!proposal) {
    return {
      title: "Proposal not found | Koncep",
      description: "This proposal could not be found."
    };
  }

  return {
    title: `${proposal.title} | Koncep`,
    description: proposal.summary
  };
}

export default async function ProposalDetailPage({
  params
}: ProposalPageProps) {
  const { id } = await params;
  const proposal = getProposalById(id);
  const events = listProposalEvents(id);

  if (!proposal) {
    notFound();
  }

  const memberId = await getMemberId();

  const ownership = db
    .select({
      ownerMemberId: proposals.ownerMemberId
    })
    .from(proposals)
    .where(eq(proposals.id, proposal.id))
    .get();

  const isOwner =
    Boolean(memberId) &&
    ownership?.ownerMemberId === memberId;

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/proposals" className="text-cyan-400 hover:text-cyan-300">
          &larr; Back to proposals
        </Link>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <p className="text-sm uppercase tracking-widest text-cyan-400">
            {proposal.category}
          </p>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold capitalize text-cyan-200">
            {proposal.status}
          </span>
        </div>

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
              <li key={role}>&bull; {role}</li>
            ))}
          </ul>

          <div className="mt-10 border-t border-slate-800 pt-8">
            <SupportProgress
              status={proposal.status}
              supporters={proposal.supporters}
            />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <SupportButton
              proposalId={proposal.id}
              initialCount={proposal.supporters}
            />

            {isOwner ? (
              <StatusAdvanceButton
                proposalId={proposal.id}
                currentStatus={proposal.status}
              />
            ) : (
              <p className="text-sm text-slate-400">
                Only the proposal owner can update its status.
              </p>
            )}
          </div>

          <ProposalTimeline events={events} />
        </div>
      </div>
    </main>
  );
}






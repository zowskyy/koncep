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
import { ContributorInterestButton } from "@/components/projects/contributor-interest-button";
import { listContributorInterests, type ContributorInterestView } from "@/lib/server/contributor-interest";
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

  const interests = isOwner ? listContributorInterests(proposal.id) : [];

  const interestsByRole = new Map<string, ContributorInterestView[]>();
  for (const interest of interests) {
    const list = interestsByRole.get(interest.role) ?? [];
    list.push(interest);
    interestsByRole.set(interest.role, list);
  }

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

          {!isOwner && proposal.status !== "completed" ? (
            <div className="mt-6 space-y-4">
              {proposal.neededRoles.map((role) => (
                <div
                  key={role}
                  className="flex flex-wrap items-center gap-3"
                >
                  <span className="text-slate-300">{role}</span>
                  <ContributorInterestButton
                    proposalId={proposal.id}
                    role={role}
                  />
                </div>
              ))}
            </div>
          ) : null}

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
              <>
                <StatusAdvanceButton
                  proposalId={proposal.id}
                  currentStatus={proposal.status}
                />

                {proposal.status === "draft" ? (
                  <Link
                    href={`/proposals/${proposal.id}/edit`}
                    className="rounded-lg bg-cyan-400 px-5 py-3 text-center font-semibold text-slate-950"
                  >
                    Edit draft
                  </Link>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-400">
                Only the proposal owner can update its status.
              </p>
            )}
          </div>

          {isOwner ? (
            <div className="mt-10 border-t border-slate-800 pt-8">
              <h2 className="text-2xl font-semibold">Interested contributors</h2>

              {interests.length === 0 ? (
                <p className="mt-4 text-slate-400">
                  No contributors have expressed interest yet.
                </p>
              ) : (
                <div className="mt-4 space-y-6">
                  {Array.from(interestsByRole.entries()).map(([role, entries]) => (
                    <div key={role}>
                      <h3 className="text-lg font-medium text-cyan-200">
                        {role}
                      </h3>
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {entries.map((entry) => (
                          <li key={entry.memberId}>
                            Member {entry.memberId.slice(0, 6)}
                            {" · "}
                            {entry.createdAt.toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <ProposalTimeline events={events} />
        </div>
      </div>
    </main>
  );
}






import Link from "next/link";
import { ProposalFilters } from "@/components/projects/proposal-filters";
import { SupportProgress } from "@/components/projects/support-progress";
import { projectStatuses, type ProjectStatus } from "@/lib/domain/project";
import {
  listProposals,
  proposalSortOptions,
  type ProposalSort
} from "@/lib/server/proposals";

type ProposalsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    status?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function toProjectStatus(value: string): ProjectStatus | undefined {
  return projectStatuses.includes(value as ProjectStatus)
    ? (value as ProjectStatus)
    : undefined;
}

function toProposalSort(value: string): ProposalSort {
  return proposalSortOptions.includes(value as ProposalSort)
    ? (value as ProposalSort)
    : "newest";
}

export default async function ProposalsPage({
  searchParams
}: ProposalsPageProps) {
  const params = await searchParams;
  const query = firstValue(params.q).trim();
  const category = firstValue(params.category).trim();
  const status = firstValue(params.status).trim();
  const sort = toProposalSort(firstValue(params.sort).trim());
  const proposalStatus = toProjectStatus(status);

  const proposals = listProposals({
    query,
    category,
    status: proposalStatus,
    sort
  });

  const categories = [...new Set(
    listProposals()
      .map((proposal) => proposal.category)
      .sort((left, right) => left.localeCompare(right))
  )];

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

        <ProposalFilters
          categories={categories}
          initialCategory={category}
          initialQuery={query}
          initialSort={sort}
          initialStatus={status}
        />

        <p className="mt-6 text-sm text-slate-400">
          {proposals.length} proposal{proposals.length === 1 ? "" : "s"} found
        </p>

        {proposals.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">No proposals found</h2>
            <p className="mt-2 text-slate-300">
              Try a different search phrase or clear the category filter.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <article
                key={proposal.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-cyan-400">{proposal.category}</p>
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold capitalize text-cyan-200">
                    {proposal.status}
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-semibold">
                  {proposal.title}
                </h2>

                <p className="mt-4 text-slate-300">{proposal.summary}</p>

                <div className="mt-4">
                  <SupportProgress
                    status={proposal.status}
                    supporters={proposal.supporters}
                  />
                </div>

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
        )}
      </div>
    </main>
  );
}


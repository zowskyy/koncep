"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { updateProposal } from "@/lib/server/actions/update-proposal";
import type { Proposal } from "@/lib/domain/proposals";

const initialEditState: { error: string | null; updated: boolean } = {
  error: null,
  updated: false
};

const categories = [
  ["games", "Games"],
  ["film-animation", "Film and animation"],
  ["music-audio", "Music and audio"],
  ["publishing", "Publishing"],
  ["software", "Software"],
  ["education", "Education"],
  ["research", "Research"],
  ["events", "Events"],
  ["physical-products", "Physical products"],
  ["community", "Community"]
] as const;

const labelToValue = new Map<string, string>(
  categories.map(([value, label]) => [label, value])
);

export function EditProposalForm({ proposal }: { proposal: Proposal }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProposal,
    initialEditState
  );

  useEffect(() => {
    if (state.updated) {
      router.push(`/proposals/${proposal.id}`);
    }
  }, [state.updated, router, proposal.id]);

  const categoryValue =
    labelToValue.get(proposal.category) ?? categories[0][0];

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-widest text-cyan-400">
          Edit draft
        </p>

        <h1 className="mt-2 text-4xl font-bold">Edit proposal</h1>

        <p className="mt-4 text-slate-300">
          Update your draft before publishing.
        </p>

        <form action={formAction} className="mt-10 space-y-6">
          <input type="hidden" name="proposalId" value={proposal.id} />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Title</span>
            <input
              name="title"
              required
              minLength={3}
              maxLength={120}
              defaultValue={proposal.title}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Category
            </span>

            <select
              name="category"
              defaultValue={categoryValue}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Short summary
            </span>

            <textarea
              name="summary"
              required
              minLength={20}
              maxLength={500}
              rows={4}
              defaultValue={proposal.summary}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Description
            </span>

            <textarea
              name="description"
              required
              minLength={50}
              maxLength={10000}
              rows={7}
              defaultValue={proposal.description}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Needed roles
            </span>

            <input
              name="neededRoles"
              required
              defaultValue={proposal.neededRoles.join(", ")}
              placeholder="Example: programmer, artist, composer"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
            />

            <span className="mt-2 block text-sm text-slate-400">
              Separate roles with commas.
            </span>
          </label>

          {state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300"
            >
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving changes..." : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}

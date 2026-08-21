"use client";

import { useActionState } from "react";
import {
  createContributorInterest,
  type CreateContributorInterestState
} from "@/lib/server/actions/create-contributor-interest";

type ContributorInterestButtonProps = {
  proposalId: string;
  role: string;
};

export function ContributorInterestButton({
  proposalId,
  role
}: ContributorInterestButtonProps) {
  const [state, formAction, pending] = useActionState<CreateContributorInterestState, FormData>(
    createContributorInterest,
    {
      error: null,
      interested: false,
      alreadyInterested: false
    }
  );

  const completed = state.interested || state.alreadyInterested;

  const label = pending
    ? "Saving interest…"
    : state.interested
      ? "Interest recorded"
      : state.alreadyInterested
        ? "Already interested"
        : "I’m interested";

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="proposalId" value={proposalId} />
        <input type="hidden" name="role" value={role} />
        <button
          type="submit"
          disabled={pending || completed}
          className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {label}
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-300">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

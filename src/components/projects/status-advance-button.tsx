"use client";

import { useActionState } from "react";
import type { ProjectStatus } from "@/lib/domain/project";
import { advanceProposalStatus } from "@/lib/server/actions/advance-proposal-status";

type StatusAdvanceButtonProps = {
  proposalId: string;
  currentStatus: ProjectStatus;
};

const nextStatusByCurrentStatus: Record<
  ProjectStatus,
  { status: ProjectStatus; label: string } | null
> = {
  draft: {
    status: "published",
    label: "Publish proposal"
  },
  published: {
    status: "supported",
    label: "Mark as supported"
  },
  supported: {
    status: "completed",
    label: "Mark as completed"
  },
  completed: null
};

export function StatusAdvanceButton({
  proposalId,
  currentStatus
}: StatusAdvanceButtonProps) {
  const next = nextStatusByCurrentStatus[currentStatus];

  const [state, formAction, pending] = useActionState(
    advanceProposalStatus,
    {
      error: null,
      status: currentStatus,
      updated: false
    }
  );

  if (!next) {
    return (
      <p className="text-sm text-slate-400">
        This proposal is completed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="proposalId" value={proposalId} />
        <input type="hidden" name="nextStatus" value={next.status} />

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-cyan-400 px-5 py-3 font-semibold text-cyan-200 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Updating..." : next.label}
        </button>
      </form>

      {state.updated ? (
        <p className="text-sm text-cyan-300">
          Status updated to {state.status}.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

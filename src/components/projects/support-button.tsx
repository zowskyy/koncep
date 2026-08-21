"use client";

import { useActionState } from "react";
import { supportProposal } from "@/lib/server/actions/support-proposal";

type SupportButtonProps = {
  proposalId: string;
  initialCount: number;
};

export function SupportButton({
  proposalId,
  initialCount
}: SupportButtonProps) {
  const [state, formAction, pending] = useActionState(
    supportProposal,
    {
      error: null,
      alreadySupported: false,
      supporters: initialCount,
      supported: false
    }
  );

  const supported = state.supported || state.alreadySupported;

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="proposalId" value={proposalId} />

        <button
          type="submit"
          disabled={pending || supported}
          className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Supporting..."
            : supported
              ? "You support this proposal"
              : "Support proposal"}
        </button>
      </form>

      <p className="text-slate-300">
        {state.supporters} community supporters
      </p>

      {state.alreadySupported ? (
        <p className="text-sm text-cyan-300">
          Your support has already been recorded.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

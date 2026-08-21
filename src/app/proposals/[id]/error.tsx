"use client";

import Link from "next/link";

type ProposalDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProposalDetailError({
  error,
  reset
}: ProposalDetailErrorProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-xl border border-red-500/30 bg-slate-900 p-8">
        <p className="text-sm uppercase tracking-widest text-red-300">
          Something went wrong
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          This proposal could not be loaded
        </h1>

        <p className="mt-4 text-slate-300">
          Please try again or return to the proposal list.
        </p>

        {error.digest ? (
          <p className="mt-4 text-sm text-slate-500">
            Error reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
          >
            Try again
          </button>

          <Link
            href="/proposals"
            className="rounded-lg border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800"
          >
            Browse proposals
          </Link>
        </div>
      </div>
    </main>
  );
}

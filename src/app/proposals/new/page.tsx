"use client";

import { FormEvent, useState } from "react";

export default function NewProposalPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-widest text-cyan-400">
          Start something
        </p>

        <h1 className="mt-2 text-4xl font-bold">Propose a project</h1>

        <p className="mt-4 text-slate-300">
          Describe an idea that could move forward with community support and
          collaboration.
        </p>

        {submitted ? (
          <div className="mt-10 rounded-xl border border-green-500/40 bg-green-500/10 p-6 text-green-300">
            Proposal draft created. Persistence will be added next.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Title</span>
              <input
                name="title"
                required
                minLength={3}
                maxLength={120}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Category
              </span>
              <select
                name="category"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
              >
                <option>Games</option>
                <option>Film and animation</option>
                <option>Music and audio</option>
                <option>Publishing</option>
                <option>Software</option>
                <option>Education</option>
                <option>Research</option>
                <option>Events</option>
                <option>Physical products</option>
                <option>Community</option>
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
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Needed roles
              </span>
              <input
                name="neededRoles"
                placeholder="Example: programmer, artist, composer"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
            >
              Publish proposal
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

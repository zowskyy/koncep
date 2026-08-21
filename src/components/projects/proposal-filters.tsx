"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ProposalFiltersProps = {
  categories: string[];
  initialCategory: string;
  initialQuery: string;
  initialStatus: string;
  initialSort: string;
};

const statuses = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "supported", label: "Supported" },
  { value: "completed", label: "Completed" }
];

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "supporters", label: "Most supported" }
];

export function ProposalFilters({
  categories,
  initialCategory,
  initialQuery,
  initialStatus,
  initialSort
}: ProposalFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    const query = params.get("q")?.trim();

    if (!query) {
      params.delete("q");
    }

    router.push(`/proposals?${params.toString()}`);
  }

  return (
    <div className="mt-8 grid gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-2 text-sm text-slate-300">
        Search
        <input
          type="search"
          defaultValue={initialQuery}
          onChange={(event) => updateFilter("q", event.target.value)}
          placeholder="Search proposals"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
        />
      </label>

      <label className="grid gap-2 text-sm text-slate-300">
        Category
        <select
          value={initialCategory}
          onChange={(event) => updateFilter("category", event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm text-slate-300">
        Status
        <select
          value={initialStatus}
          onChange={(event) => updateFilter("status", event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm text-slate-300">
        Sort
        <select
          value={initialSort}
          onChange={(event) => updateFilter("sort", event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
        >
          {sortOptions.map((sortOption) => (
            <option key={sortOption.value} value={sortOption.value}>
              {sortOption.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

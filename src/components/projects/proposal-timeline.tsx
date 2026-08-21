import type { ProposalEvent } from "@/lib/domain/proposal-events";

type ProposalTimelineProps = {
  events: ProposalEvent[];
};

const eventLabels = {
  created: "Proposal created",
  updated: "Proposal updated",
  published: "Proposal published",
  community_backed: "Community support threshold reached",
  completed: "Proposal completed"
} as const;

export function ProposalTimeline({
  events
}: ProposalTimelineProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 border-t border-slate-800 pt-8">
      <h2 className="text-2xl font-semibold">Activity</h2>

      <ol className="mt-5 space-y-4 border-l border-slate-700 pl-5">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-cyan-400" />
            <p className="font-medium text-white">{eventLabels[event.type]}</p>
            <p className="mt-1 text-sm text-slate-400">
              {event.createdAt.toLocaleString()}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

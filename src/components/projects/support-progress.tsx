import type { ProjectStatus } from "@/lib/domain/project";
import { SUPPORT_THRESHOLD } from "@/lib/domain/support";

type SupportProgressProps = {
  supporters: number;
  status: ProjectStatus;
};

export function SupportProgress({
  supporters,
  status
}: SupportProgressProps) {
  if (status === "draft") {
    return null;
  }

  if (status === "supported" || status === "completed") {
    return (
      <p className="text-sm font-medium text-cyan-300">
        Community-backed
      </p>
    );
  }

  const cappedSupporters = Math.min(supporters, SUPPORT_THRESHOLD);
  const progress = Math.round(
    (cappedSupporters / SUPPORT_THRESHOLD) * 100
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">
          {supporters} of {SUPPORT_THRESHOLD} supporters
        </span>
        <span className="font-medium text-cyan-300">{progress}%</span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label="Support progress"
        aria-valuemin={0}
        aria-valuemax={SUPPORT_THRESHOLD}
        aria-valuenow={cappedSupporters}
      >
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

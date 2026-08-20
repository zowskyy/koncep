"use client";

import { useState } from "react";

type SupportButtonProps = {
  initialCount: number;
};

export function SupportButton({ initialCount }: SupportButtonProps) {
  const [supported, setSupported] = useState(false);
  const count = initialCount + (supported ? 1 : 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setSupported((current) => !current)}
        className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
      >
        {supported ? "Supported" : "Support proposal"}
      </button>

      <p className="mt-3 text-sm text-slate-400">
        {count.toLocaleString()} community supporters
      </p>
    </div>
  );
}

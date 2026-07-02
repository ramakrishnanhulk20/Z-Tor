"use client";

import { useState } from "react";

type Props = {
  note: string;
  poolId: string;
};

export function NotePanel({ note, poolId }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([note], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ztor-note-${poolId}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-coral/30 bg-coral-soft p-6 md:p-7">
      <p className="eyebrow text-coral-dark">Your secret note — save it now</p>
      <p className="mt-4 break-all rounded-2xl border border-line/80 bg-paper p-4 font-mono text-xs leading-relaxed text-ink">
        {note}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="btn-secondary !px-5 !py-2.5 text-xs">
          {copied ? "Copied" : "Copy note"}
        </button>
        <button type="button" onClick={download} className="btn-secondary !px-5 !py-2.5 text-xs">
          Download as file
        </button>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-ink-soft md:text-sm">
        This note is the only key to your funds. Store it offline. If you lose
        it, nobody can recover your deposit. Not even us.
      </p>
    </div>
  );
}

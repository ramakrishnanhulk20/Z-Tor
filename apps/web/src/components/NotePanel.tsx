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
    <div className="rounded-xl border border-coral/40 bg-coral-soft p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-coral-dark">
        Your secret note. Save it now
      </p>
      <p className="mt-3 break-all rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-relaxed text-ink">
        {note}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn-secondary !px-4 !py-2">
          {copied ? "Copied" : "Copy note"}
        </button>
        <button type="button" onClick={download} className="btn-secondary !px-4 !py-2">
          Download as file
        </button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        This note is the only key to your funds. Store it offline. If you lose
        it, nobody can recover your deposit. Not even us.
      </p>
    </div>
  );
}

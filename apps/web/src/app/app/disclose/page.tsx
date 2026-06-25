"use client";

import { useMemo, useRef, useState } from "react";
import { usePublicClient } from "wagmi";
import { PageShell } from "@/components/PageShell";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { poolTierFromId } from "@/lib/pools";
import { usePoolAddress } from "@/hooks/usePoolAddress";
import { buildDisclosure, type DisclosureReport } from "@/lib/disclosure";
import { parseNote } from "@/lib/note";

type Phase = "idle" | "working" | "done";

export default function DisclosePage() {
  const [noteInput, setNoteInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<DisclosureReport | null>(null);
  const [spent, setSpent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicClient = usePublicClient();
  const parsed = useMemo(() => parseNote(noteInput), [noteInput]);
  const pool = parsed ? poolTierFromId(parsed.poolId) ?? undefined : undefined;
  const { poolAddress, notDeployed } = usePoolAddress(parsed?.poolId ?? "");

  const noteLooksWrong = noteInput.trim().length > 0 && !parsed;

  const handleNoteFile = async (file: File | undefined) => {
    if (!file) return;
    setNoteInput((await file.text()).trim());
    setReport(null);
    setErrorMessage(undefined);
    setPhase("idle");
  };

  const handleGenerate = async () => {
    if (!parsed || !pool || !poolAddress || !publicClient) return;
    setErrorMessage(undefined);
    setReport(null);
    setPhase("working");
    try {
      const result = await buildDisclosure(publicClient, poolAddress, pool, parsed);
      if (result.kind === "not-found") {
        setPhase("idle");
        setErrorMessage("No deposit was found for this note in the pool.");
        return;
      }
      setReport(result.report);
      setSpent(result.spent);
      setPhase("done");
    } catch {
      setPhase("idle");
      setErrorMessage("Could not build the report. Please try again in a minute.");
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ztor-disclosure-${report.pool.id}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell
      title="Voluntary disclosure"
      subtitle="Generate a report that proves what one of your notes did — for an auditor, accountant, or anyone you choose. Only you can create it, and sharing is always your decision."
      eyebrow="Compliance optional"
    >
      <InfoBanner tone="warning" title="Sharing reduces privacy for that note">
        A disclosure report reveals the deposit (and withdrawal, if spent) linked to{" "}
        <em>this note only</em>. Other notes stay private. Everything is computed in your browser.
      </InfoBanner>

      <label className="mt-8 block space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Secret note
        </span>
        <textarea
          value={noteInput}
          onChange={(e) => {
            setNoteInput(e.target.value);
            setReport(null);
            setPhase("idle");
          }}
          rows={4}
          placeholder="ztor-v1-…"
          disabled={phase === "working"}
          className="input-field font-mono"
        />
        {noteLooksWrong && (
          <p className="text-xs text-coral-dark">
            This doesn&apos;t look like a valid Z-Tor note. Check for missing characters.
          </p>
        )}
        {parsed && pool && (
          <p className="text-xs text-muted">Recognized: {pool.label} pool note.</p>
        )}
      </label>

      <div className="mt-3 flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => {
            void handleNoteFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={phase === "working"}
          className="btn-secondary !px-4 !py-2"
        >
          Load note file
        </button>
      </div>

      <div className="flow-panel mt-8">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Report contents
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-relaxed text-ink-soft">
          <li>Pool tier and deposit timestamp with Etherscan link</li>
          <li>Withdrawal recipient and tx link (after you withdraw)</li>
          <li>Cryptographic ownership proof (safe only after note is spent)</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!parsed || phase === "working" || notDeployed}
        className="btn-primary mt-8 w-full"
      >
        {phase === "working" ? "Scanning the blockchain…" : "Generate disclosure report"}
      </button>

      {errorMessage && (
        <InfoBanner tone="warning" className="mt-5">
          {errorMessage}
        </InfoBanner>
      )}

      {phase === "done" && report && (
        <div className="mt-8 space-y-5">
          <div className="gradient-ring glass-card p-6 md:p-8">
            <p className="font-serif text-xl font-medium tracking-tight">
              {spent ? "Full report ready" : "Deposit-only report ready"}
            </p>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="rounded-xl border border-line bg-ivory/70 p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Deposit
                </dt>
                <dd className="mt-2 text-ink-soft">
                  {report.pool.label} on{" "}
                  {new Date(report.deposit.timestamp).toLocaleString()}{" "}
                  <a
                    href={report.deposit.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-arrow"
                  >
                    Etherscan →
                  </a>
                </dd>
              </div>
              <div className="rounded-xl border border-line bg-ivory/70 p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Withdrawal
                </dt>
                <dd className="mt-2 text-ink-soft">
                  {report.withdrawal ? (
                    <>
                      To{" "}
                      <span className="font-mono text-xs">{report.withdrawal.recipient}</span>{" "}
                      <a
                        href={report.withdrawal.explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-arrow"
                      >
                        Etherscan →
                      </a>
                    </>
                  ) : (
                    "Not withdrawn yet — full proof available after spend."
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <button type="button" onClick={downloadReport} className="btn-primary">
            Download report (JSON)
          </button>
          <p className="text-xs leading-relaxed text-muted">
            Only share this file with people who should see this note&apos;s history.
          </p>
        </div>
      )}
    </PageShell>
  );
}

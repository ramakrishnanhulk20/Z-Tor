type Props = {
  steps: readonly string[];
  /** Index of the active step; pass steps.length when everything is done. */
  current: number;
};

export function FlowSteps({ steps, current }: Props) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2.5">
            {i > 0 && <span aria-hidden className="h-px w-6 bg-line" />}
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-ink text-paper"
                  : active
                    ? "bg-coral text-white"
                    : "border border-line text-muted"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-sm ${active ? "font-semibold text-ink" : "font-medium text-muted"}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

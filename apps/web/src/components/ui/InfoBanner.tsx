import type { ReactNode } from "react";

type Tone = "neutral" | "warning" | "info" | "success";

const toneClass: Record<Tone, string> = {
  neutral: "border-line bg-ivory",
  warning: "border-coral/30 bg-coral-soft",
  info: "border-ink/10 bg-paper",
  success: "border-emerald-200 bg-emerald-50/80",
};

type Props = {
  title?: string;
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
};

export function InfoBanner({
  title,
  children,
  tone = "neutral",
  icon,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border p-5 text-sm leading-relaxed text-ink-soft ${toneClass[tone]} ${className}`}
    >
      {(title || icon) && (
        <div className="mb-2 flex items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              {icon}
            </span>
          )}
          {title && <p className="font-medium text-ink">{title}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

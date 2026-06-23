import type { ReactNode } from "react";

type Props = {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
};

/** Two-column layout for flow pages: main content + optional sidebar */
export function FeaturePanel({ label, title, description, children, aside }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div>
        <p className="eyebrow text-coral">{label}</p>
        <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      {aside && (
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">{aside}</aside>
      )}
    </div>
  );
}

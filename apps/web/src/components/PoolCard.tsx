import Link from "next/link";
import { confidentialLabel } from "@/config/display";
import type { PoolTier } from "@/config/pools";

type Props = {
  pool: PoolTier;
  href: string;
};

export function PoolCard({ pool, href }: Props) {
  return (
    <Link
      href={href}
      className="card group block p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <p className="eyebrow">{confidentialLabel(pool.asset)} pool</p>
      <p className="mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        {pool.label}
      </p>
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="text-xs text-muted">Fixed amount</span>
        <span className="text-sm font-medium text-coral transition-colors group-hover:text-coral-dark">
          Deposit →
        </span>
      </div>
    </Link>
  );
}

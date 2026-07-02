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
      className="card group block h-full p-7 transition-all hover:-translate-y-1 hover:border-coral/25 hover:shadow-lift active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2"
    >
      <p className="eyebrow">{confidentialLabel(pool.asset)} pool</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
        {pool.label}
      </p>
      <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
        <span className="text-xs font-medium text-muted">Fixed amount</span>
        <span className="text-sm font-semibold text-coral transition-colors group-hover:text-coral-dark">
          Deposit ↗
        </span>
      </div>
    </Link>
  );
}

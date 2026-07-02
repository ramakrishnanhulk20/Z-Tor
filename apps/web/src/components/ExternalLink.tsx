import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  showIcon?: boolean;
};

export function ExternalLink({
  children,
  showIcon = true,
  className = "",
  ...props
}: Props) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...props}
    >
      {children}
      {showIcon && (
        <span aria-hidden className="ml-0.5 inline-block text-[0.9em] leading-none">
          ↗
        </span>
      )}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

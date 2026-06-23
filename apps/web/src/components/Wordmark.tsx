import Image from "next/image";

type Props = {
  /** "light" for dark backgrounds, "dark" for light backgrounds. */
  tone?: "dark" | "light";
  /** Show the Z-Tor wordmark text beside the logo. */
  showText?: boolean;
  className?: string;
  /** Logo mark size in pixels */
  size?: number;
};

const LOGO_SRC = "/favicon/z-tor-logo.png";

export function Wordmark({
  tone = "dark",
  showText = true,
  className = "",
  size = 36,
}: Props) {
  const text = tone === "dark" ? "text-ink" : "text-paper";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={LOGO_SRC}
        alt="Z-Tor"
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
        priority
      />
      {showText && (
        <span
          className={`font-serif text-2xl font-semibold tracking-tight md:text-3xl ${text}`}
        >
          Z-Tor
        </span>
      )}
    </span>
  );
}

/** Logo mark only — favicon-sized for compact UI */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Z-Tor"
      width={size}
      height={size}
      className={`shrink-0 rounded-md ${className}`}
    />
  );
}

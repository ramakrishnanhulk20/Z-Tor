/** Zama-style ambient glow — slow drifting coral blobs on the hero right. */
export function HeroAmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="hero-glow hero-glow-primary" />
      <div className="hero-glow hero-glow-secondary" />
      <div className="hero-glow hero-glow-accent" />
    </div>
  );
}

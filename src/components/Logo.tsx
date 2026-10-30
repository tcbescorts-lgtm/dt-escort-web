/**
 * Brand lockup: monogram mark + wordmark. Built from type so it stays crisp at
 * every size (the illustrated badge is kept for the About page and app icons).
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
      <rect x="1.5" y="1.5" width="45" height="45" rx="9" fill="var(--bg)" stroke="var(--gold-fill)" strokeWidth="2" />
      <rect x="5.5" y="5.5" width="37" height="37" rx="6" fill="none" stroke="var(--gold-fill)" strokeOpacity="0.35" strokeWidth="1" />
      <text
        x="24"
        y="29.5"
        textAnchor="middle"
        fontFamily="var(--font-condensed), 'Arial Narrow', sans-serif"
        fontWeight="800"
        fontSize="17"
        letterSpacing="-0.3"
        fill="var(--gold-fill)"
      >
        D&amp;T
      </text>
      <path d="M12 36h24" stroke="var(--gold-fill)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={compact ? 34 : 40} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.2rem] font-bold tracking-tight">D &amp; T</span>
        <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold">Escort Service</span>
      </span>
    </span>
  );
}

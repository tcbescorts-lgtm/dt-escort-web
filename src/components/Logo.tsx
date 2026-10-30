import Image from "next/image";

/** Brand lockup: the company badge (light gray and gold) with the name beside it. */
export default function Logo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 40 : 46;
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/brand/dt-logo-graygold.png"
        alt=""
        width={size}
        height={size}
        priority={!compact}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size }}
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.2rem] font-bold tracking-tight">D &amp; T</span>
        <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold">Escort Service</span>
      </span>
    </span>
  );
}

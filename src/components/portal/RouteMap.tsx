/** Route between two places inside the portal (Google Maps embed). Uses the Embed API key when set. */
export default function RouteMap({ from, to, height = 260 }: { from: string; to: string; height?: number }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const src = key
    ? `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&mode=driving`
    : `https://maps.google.com/maps?saddr=${encodeURIComponent(from)}&daddr=${encodeURIComponent(to)}&output=embed`;
  return (
    <iframe title={`Route from ${from} to ${to}`} src={src} style={{ height }} className="w-full rounded-md border border-rule" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
  );
}

import { Container } from "@/components/Blocks";
import QuoteForm from "@/components/forms/QuoteForm";
import { STATES_48 } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Request a Pilot Car Quote",
  description:
    "Request a quote for an oversize load escort. Send pickup, drop-off, date and load dimensions, and D & T Escort Service will get back to you.",
  path: "/quote",
});

const VALID = new Set<string>(STATES_48.map(([a]) => a));

export default async function Quote({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state: raw } = await searchParams;
  const state = raw && VALID.has(raw.toUpperCase()) ? raw.toUpperCase() : undefined;
  return (
    <div className="min-h-[calc(100svh-3.75rem)]">
      <Container className="py-5 md:py-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="display-2">Request a quote</h1>
          <p className="mt-1 text-sm text-muted">Send the route, date and load size. Dispatch replies by phone or email.</p>
          <div className="mt-5 border-t border-rule pt-5">
            <QuoteForm state={state} />
          </div>
        </div>
      </Container>
    </div>
  );
}

import { Container } from "@/components/Blocks";
import QuoteForm from "@/components/forms/QuoteForm";
import { PhoneIcon } from "@/components/Icons";
import { STATES_48, company } from "@/lib/site";
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
    <div className="flush-end backdrop min-h-[calc(100svh-3.75rem)]">
      <Container className="py-5 md:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <h1 className="display-2">Request a quote</h1>
            <p className="text-sm text-muted">
              Moving today or tomorrow? Call{" "}
              <a href={company.telHref} className="link inline-flex items-center gap-1 font-semibold">
                <PhoneIcon size={14} /> {company.phoneDisplay}
              </a>
            </p>
          </div>
          <div className="panel panel-gold mt-4 p-4 sm:p-6">
            <QuoteForm state={state} />
          </div>
        </div>
      </Container>
    </div>
  );
}

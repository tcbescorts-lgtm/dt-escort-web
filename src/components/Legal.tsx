import { Container } from "./Blocks";
import { LEGAL } from "@/lib/site";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Container className="pt-12 md:pt-20">
      <h1 className="display-1">{title}</h1>
      <p className="mt-4 text-muted">
        Last updated {LEGAL.lastUpdated}. Effective date: {LEGAL.effectiveDate}.
      </p>
      {LEGAL.isDraft && (
        <div role="note" className="mt-6 max-w-3xl rounded-md border-2 border-gold-fill p-4">
          <p className="font-semibold">Draft for attorney review</p>
          <p className="mt-1 text-muted">
            This policy is a working draft and is not yet in effect. Highlighted items still need
            confirming by the business.
          </p>
        </div>
      )}
      <div className="prose-dt mt-10">{children}</div>
    </Container>
  );
}

/** Marks text the business still has to confirm. Shown highlighted while the page is a draft. */
export function Confirm({ children }: { children: React.ReactNode }) {
  if (!LEGAL.isDraft) return <>{children}</>;
  return (
    <mark className="rounded-sm bg-gold-fill px-1 text-on-gold">
      {children}
      <span className="sr-only"> (to be confirmed)</span>
    </mark>
  );
}

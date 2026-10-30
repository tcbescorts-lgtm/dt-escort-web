import { Container, PageIntro } from "@/components/Blocks";
import DeletionForm from "./DeletionForm";
import { LEGAL, company } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Data Deletion Request",
  description: "Ask D & T Escort Service to delete the personal information you've sent us.",
  path: "/data-deletion",
});

export default function DataDeletion() {
  return (
    <>
      <PageIntro
        title="Ask us to delete your information"
        lede={`Use this form to have us delete what you've sent us, such as quote requests or driver interest forms. We'll finish within ${LEGAL.deletionResponseDays} days.`}
      />
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="max-w-2xl"><DeletionForm /></div>
          <aside aria-labelledby="del-how" className="h-fit border-t border-rule pt-5 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            <h2 id="del-how" className="display-3">What happens next</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
              <li>We email you from {company.email} to confirm the request came from you.</li>
              <li>Once you reply, we delete the matching records from our email, forms and systems.</li>
              <li>We email you when it&apos;s done, within {LEGAL.deletionResponseDays} days of verifying.</li>
            </ol>
            <p className="mt-4 text-muted">
              We may have to keep invoices and payment records for tax and accounting law. If so, we&apos;ll
              tell you what we kept and why.
            </p>
          </aside>
        </div>
      </Container>
    </>
  );
}

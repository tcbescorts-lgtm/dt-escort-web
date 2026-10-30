import Link from "next/link";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-4 md:px-6 ${className}`}>{children}</div>;
}

export function PageIntro({ title, lede, children }: { title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-8 border-b border-rule md:mb-12">
      <Container className="pt-8 pb-7 md:pt-12 md:pb-10">
        <h1 className="text-[1.75rem] font-bold leading-tight md:text-[2.25rem] max-w-4xl">{title}</h1>
        {lede && <p className="lede mt-4">{lede}</p>}
        {children}
      </Container>
    </div>
  );
}

export function Actions({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Link href="/quote" className="btn btn-gold">Request a Quote</Link>
    </div>
  );
}

export function CtaBand({ title = "Have a load that needs escorts?", text }: { title?: string; text?: string }) {
  return (
    <section aria-labelledby="cta-heading" className="flush-end mt-16 border-t border-rule bg-surface md:mt-20">
      <Container className="grid gap-6 py-10 md:grid-cols-[1fr_auto] md:items-center md:py-12">
        <div>
          <h2 id="cta-heading" className="text-xl font-bold md:text-2xl">{title}</h2>
          <p className="mt-2 text-muted measure text-[0.95rem]">
            {text ?? "Send the route, date and dimensions and we'll get back to you with a quote. Dispatch answers 24/7 if the move is close."}
          </p>
        </div>
        <Actions />
      </Container>
    </section>
  );
}

/** Two-column row used for content sections: heading left, body right. */
export function Split({ id, title, children, as: H = "h2" }: { id?: string; title: React.ReactNode; children: React.ReactNode; as?: "h2" | "h3" }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="scroll-mt-24 border-t border-rule py-8 md:py-10">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
        <H id={id ? `${id}-h` : undefined} className="text-lg font-bold">{title}</H>
        <div className="measure">{children}</div>
      </div>
    </section>
  );
}

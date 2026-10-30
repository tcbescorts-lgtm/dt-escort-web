"use client";

import { Container, PageIntro } from "@/components/Blocks";
import { ConsentBox, TextArea, TextField } from "@/components/forms/Field";
import WebForm from "@/components/forms/WebForm";
import { careersSchema } from "@/lib/forms";

const labels = {
  name: "Name", phone: "Phone", email: "Email", homeState: "Home state",
  certifications: "Certifications", notes: "Anything else", consent: "Consent",
};

export default function CareersClient() {
  return (
    <>
      <PageIntro
        title="Drive with D & T"
        lede="We're always glad to hear from certified pilot car operators. Leave your contact details and we'll reach out when we have work in your area."
      />
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="max-w-2xl">
            <WebForm
              schema={careersSchema}
              labels={labels}
              subject={(d) => `Driver interest: ${d.name} (${d.homeState})`}
              toPayload={(d) => ({
                name: d.name, phone: d.phone, email: d.email, "Home state": d.homeState,
                Certifications: d.certifications || "(none listed)", Notes: d.notes || "(none)", replyto: d.email,
              })}
              recordType="careers"
      submitLabel="Send"
              sendingLabel="Sending…"
              success={
                <>
                  <h2 className="display-3">Thanks, we got it</h2>
                  <p className="mt-2">We&apos;ll contact you if we have work that fits. We don&apos;t need any documents yet.</p>
                </>
              }
            >
              {(errors) => (
                <>
                  <TextField name="name" label="Name" required errors={errors} autoComplete="name" />
                  <div className="grid gap-6 md:grid-cols-2">
                    <TextField name="phone" label="Phone" type="tel" required errors={errors} autoComplete="tel" inputMode="tel" />
                    <TextField name="email" label="Email" type="email" required errors={errors} autoComplete="email" />
                  </div>
                  <TextField name="homeState" label="Home state" required errors={errors} autoComplete="address-level1" />
                  <TextField name="certifications" label="Certifications" hint="For example: PEVO, and any state certifications you hold" errors={errors} />
                  <TextArea name="notes" label="Anything else" hint="Positions you run, equipment, availability" errors={errors} rows={4} />
                  <ConsentBox errors={errors}>
                    I agree to be contacted about driving for D &amp; T Escort Service. See the{" "}
                    <a href="/privacy" className="link">Privacy Policy</a>.
                  </ConsentBox>
                </>
              )}
            </WebForm>
          </div>
          <aside aria-labelledby="careers-why" className="h-fit rounded-md border border-rule bg-surface p-6">
            <h2 id="careers-why" className="display-3">Why we ask so little</h2>
            <p className="mt-3 text-muted">
              Don&apos;t send your license number, date of birth or Social Security number through this
              form. If we move forward, we&apos;ll collect what&apos;s needed through our secure driver
              portal.
            </p>
          </aside>
        </div>
      </Container>
    </>
  );
}

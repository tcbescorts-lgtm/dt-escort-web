# D & T Escort Service: website and operations portal

Public website and owner/admin/driver portal for **D & T Escort Service LLC**, 3897 I-55 S, Jackson, MS 39212. Live at https://dtescortservice.com.

> **Legal pages are first drafts, not attorney-reviewed.** Privacy Policy, Terms of Service, Refund Policy, Cookie Policy and the Accessibility Statement were written from the business's answers and must be reviewed by a licensed attorney. They are published (effective October 30, 2026) at the business's request. Setting `LEGAL.isDraft = true` in `src/lib/site.ts` shows a draft notice and highlights the items listed in CLAIMS_REVIEW.md.

## Stack (free tiers)
| Piece | Used for | Free-tier note |
|---|---|---|
| Next.js 15 + TypeScript + Tailwind 4 | Site and portal | |
| Vercel Hobby | Hosting, daily cron | Vercel limits Hobby to non-commercial use; the business chose it knowingly. Upgrade to Pro if Vercel asks. |
| Supabase | Postgres, sign-in, private file storage, Row Level Security | 500 MB DB, 1 GB files; pauses after 7 days with no activity |
| Web3Forms | Public form emails | 250 submissions/month |
| Resend | Invoice and alert email, delivery tracking | 3,000/month, 100/day |
| Stripe | Optional online invoice payment | No monthly fee; per-transaction fees |
| Web Push (VAPID) | Phone/desktop alerts | Free |
| Google Maps Embed | Contact map (after consent), driver route map | Free, unlimited |
| @react-pdf/renderer, Recharts | Invoice PDFs, dashboard charts | Open source |

## Phases
| # | Phase | Status |
|---|---|---|
| 1–3 | Stack, design system, public site, forms, SEO, legal, cookie banner | Live |
| 4 | Database schema, auth, roles, RLS | Built and tested (supabase/tests/rls_test.sql) |
| 5 | Admin dashboard, customers, drivers | Built |
| 6 | Book a Load with notes parser, assignment, notifications | Built |
| 7 | Driver PWA: status, loads with map, run sheet (offline drafts) | Built |
| 8 | Invoices, PDF, email tracking, payments, Stripe, driver runs, reports | Built |
| 9 | Audits | Public site: Lighthouse 100 a11y/SEO/best practices; axe clean. Portal: re-run after Supabase is connected |
| 10 | Deploy, domain, admin guide | Domain live; portal goes live once the keys below are added |

## Turning on the portal (one time)
1. **Supabase**: create a project (region East US). In **SQL Editor**, paste and run `supabase/migrations/20261030000001_init.sql`. Optional: run `supabase/seed_sample_data.sql` to try things with fake data, and `supabase/remove_sample_data.sql` to clear it.
2. **Supabase → Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up" (only the office creates accounts). Minimum password length 10.
3. **Supabase → Authentication → URL Configuration**: Site URL `https://dtescortservice.com`; redirect URL `https://dtescortservice.com/auth/callback`.
4. **First owner account**: Supabase → Authentication → Users → **Add user** (email + password, auto-confirm), then in SQL Editor run
   `update public.profiles set role = 'owner', full_name = 'Owner name', must_change_password = false where email = 'owner@email';`
5. **Vercel → Settings → Environment Variables** (Production and Preview), then redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
   - `CRON_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (generated values are in the private file given to the business, never in this repo)
   - `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_WEBHOOK_SECRET` once Resend is verified
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` when using Stripe
6. **Resend**: verify `dtescortservice.com` (add its DNS records in Namecheap). Webhook → `https://dtescortservice.com/api/webhooks/resend`, events: sent, delivered, opened, bounced, complained, failed.
7. **Stripe**: Developers → Webhooks → `https://dtescortservice.com/api/webhooks/stripe`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Enable card and US bank account (ACH) in Payment methods.
8. The daily Vercel cron (`vercel.json`) queries the database every day, which should keep the free Supabase project from pausing for inactivity.

## Security model
- Every table has Row Level Security. Drivers see only their own profile, loads, run sheets, pay and notifications; they never see rate cards, other drivers, audit log or sensitive fields. Tested per role in `supabase/tests/rls_test.sql` (run against plain Postgres with `supabase/tests/stubs.sql`).
- Owner-only: users and roles, reports, audit log. Admin: everything operational.
- Sensitive driver fields (DOB, license number, VIN) live in `driver_private` with no table access; read/write only through audited functions.
- The service-role key is server-only (`src/lib/supabase/admin.ts`), used for account creation, login lockout, webhooks, the public invoice link, the public deletion queue and the cron job.
- Sign-in: 5 failed attempts per email in 15 minutes locks sign-in; Supabase's own rate limits also apply. Accounts are created with a unique temporary password and must change it before using anything. Idle timeout: 8 h office, 12 h drivers. Cookies are httpOnly/secure (Supabase SSR). Server Actions carry Next.js's built-in origin check (CSRF protection).
- Uploads: PDF/JPG/PNG/WEBP/HEIC only, 10 MB max, enforced by the storage buckets themselves and checked in the browser. Files live in private buckets under the driver's own folder and open through 60-second signed links.
- No SSNs or card numbers are stored anywhere. Payment handles are last-4 only.

## Run it locally
```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm test           # notes parser + run sheet / driver pay math
npm run contrast   # WCAG AA check for every color pairing
npm run build
```

## Where things live
- `src/lib/site.ts`: business facts, claims, legal flags. **Change facts here only.**
- `src/app/(site)`: public pages. `src/app/portal`: office portal. `src/app/driver`: driver app. `src/app/i/[token]`: public invoice link.
- `src/lib/parseNotes.ts`: booking-notes parser. `src/lib/runsheet.ts`: pay math. `src/lib/invoice-pdf.tsx`: invoice PDF.
- `supabase/`: migration, tests, optional sample data.
- `docs/ADMIN_GUIDE.md`, `docs/FEATURE_RESEARCH.md`, `CLAIMS_REVIEW.md`, `DATA_INVENTORY.md`, `THIRD_PARTY_AUDIT.md`, `LICENSES.md`.

## Decisions on record
- Owner = "Boss"; admin = Jim. Default "Booked by" list: Jim, Boss (editable in Settings).
- Driver pay (from the business's tracking sheet): `QP fee = load total × QP%`, `Driver pay = (load total − QP fee − gas) × split %`, `Profit = load total − driver pay − gas − QP fee`. Split is per driver, locked when a run sheet is approved. Pay statements have Subtotal, Cash advances and Due to driver.
- Invoice numbers `DT-1001` onward; load numbers `L-1001` onward. Payment methods: ACH, Zelle, CashApp, Stripe link.
- Deletion requests answered within 30 days.
- Known gaps: legal page text is edited in code rather than in Settings; new escort position types need a database change; SMS (Twilio) and Google Directions mileage are not included because they aren't free.

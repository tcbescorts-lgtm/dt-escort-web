# D & T Escort Service: website and operations portal

Public website and (coming in later phases) the owner/admin/driver portal for **D & T Escort Service LLC**, 3897 I-55 S, Jackson, MS 39212.

> **Legal pages are first drafts, not attorney-reviewed.** Privacy Policy, Terms of Service, Refund Policy, Cookie Policy and the Accessibility Statement were written from the business's answers and must be reviewed by a licensed attorney. They are published (effective October 30, 2026) at the business's request. Setting `LEGAL.isDraft = true` in `src/lib/site.ts` shows a draft notice and highlights the items listed in CLAIMS_REVIEW.md.

## Stack (all on free tiers)
- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- Vercel Hobby hosting. Note: Vercel's terms limit Hobby to non-commercial use; the business chose Hobby knowingly. If Vercel flags the project, upgrade to Pro or move to Cloudflare Workers.
- Web3Forms for public forms (free: 250 submissions/month)
- Google Maps Embed API (free, unlimited); only loads after cookie consent
- Coming next: Supabase (Postgres, Auth, Storage, RLS), Resend, Stripe, web push

## Build phases
| # | Phase | Status |
|---|---|---|
| 1 | Stack, questions, placeholders | Done |
| 2 | Design system, layout, dark/light mode, accessibility baseline | Done |
| 3 | Public site, forms, SEO, legal drafts, cookie banner, deletion request | Done (forms need the Web3Forms key) |
| 4 | Supabase schema, auth, roles, RLS | Next |
| 5 | Admin dashboard, customers, drivers | |
| 6 | Book a Load, notes parser, assignment, notifications | |
| 7 | Driver PWA, status, loads with map, run sheet | |
| 8 | Invoices, email tracking, payments, driver runs/payouts, reports | |
| 9 | Audits | |
| 10 | Deploy, domain, admin guide | |

## Run it locally
Requires Node 20+.
```bash
npm install
cp .env.example .env.local   # then fill in the keys you have
npm run dev                  # http://localhost:3000
npm run contrast             # checks every color pairing against WCAG AA
npm run build                # production build (must pass before deploying)
```

## Deploy to Vercel (one time)
1. Push this repo to GitHub (private).
2. In Vercel: **Add New > Project**, import the repo. Framework is detected as Next.js; keep the defaults.
3. **Settings > Environment Variables**: add `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WEB3FORMS_KEY`, and (optional) `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`.
4. Deploy. Every later push to GitHub builds a preview automatically; pushes to `main` go to production. Preview builds are kept out of search engines by `robots.ts`.

### Custom domain (dtescortservice.com on Namecheap)
1. Vercel project > **Settings > Domains** > add `dtescortservice.com` and `www.dtescortservice.com`.
2. In Namecheap > Domain List > Manage > **Advanced DNS**, add the records Vercel shows (normally an `A` record for `@` to Vercel's IP and a `CNAME` for `www` to `cname.vercel-dns.com`). Remove Namecheap's default parking records.
3. Wait for Vercel to show "Valid Configuration". HTTPS is automatic.

### Web3Forms
1. Go to web3forms.com, enter **dtescortservice@gmail.com**, and copy the access key from the email.
2. Put it in `NEXT_PUBLIC_WEB3FORMS_KEY` (Vercel and `.env.local`).
3. In the Web3Forms dashboard, restrict submissions to the `dtescortservice.com` domain.

Validation: every form is validated in the browser with the same Zod schema (`src/lib/forms.ts`), and Web3Forms validates the key, honeypot and fields on its server. When the portal database arrives (Phase 4), quote and deletion requests will also be saved server side.

### Google Maps Embed key (optional)
Google Cloud Console > enable **Maps Embed API** > create an API key > restrict it to HTTP referrers `https://dtescortservice.com/*` and `https://*.vercel.app/*`, and to the Maps Embed API only.

## Where things live
- `src/lib/site.ts`: business facts, claims, navigation, states, legal flags. **Change facts here only.**
- `src/lib/content.ts`: reusable copy (cargo types, steps, FAQ, equipment)
- `src/app/*`: pages. `src/components/*`: shared UI
- `src/app/globals.css`: design tokens (dark default + light), checked by `scripts/contrast.mjs`
- `CLAIMS_REVIEW.md`, `DATA_INVENTORY.md`, `THIRD_PARTY_AUDIT.md`, `LICENSES.md`: compliance records

## Design notes
- Type: Barlow Condensed for headings (the highway-sign feel of the trade), Barlow for body.
- Light mode uses darker gold `#7D610D` for text and links (the brief's `#8C6D0F` passes on white but fails on the alt panel color), and gold buttons get a dark gold outline so their shape reads on cream.
- Decorative divider color (`--rule`) is never used as the only boundary of a control; inputs and controls use `--field` (3:1+).
- No illustrations or animations, by the business's request: the real logo is the only image. Motion is limited to what the browser does, and reduced-motion settings are respected.

## Decisions on record (2026-10-29)
- Owner role = "Boss"; admin = Jim. Default "Booked by" list: Jim, Boss (editable).
- Driver pay per run (copied from the business's tracking sheet):
  `QP fee = load total × QP%`, `Driver pay = (load total − QP fee − gas) × driver split %`, `Profit = load total − driver pay − gas − QP fee`. Split % is set per driver. The Driver Runs report per pay period also has Subtotal and Cash Advances lines.
- Invoice numbers: `DT-1001` onward. Payment methods on invoices: ACH, Zelle, CashApp, plus Stripe link.
- Temporary driver passwords: unique and random per driver, forced change at first login.
- Session timeout: 12 h drivers, 8 h admin/owner. Data deletion response: 30 days.

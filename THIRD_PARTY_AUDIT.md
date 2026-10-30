# Third-party services and scripts audit

Rule: nothing non-essential loads before the visitor accepts. The public site currently loads **no third-party scripts at all**. Fonts and the logo are self-hosted.

| Service | Purpose | When it loads / is called | Data it receives | Cookies | Essential? |
|---|---|---|---|---|---|
| Vercel | Hosting | Every request | IP address, user agent, requested URL (server logs) | None set by default | Yes |
| Web3Forms | Delivers form submissions to email | Only when a visitor submits a form (browser `fetch` to api.web3forms.com) | The form fields listed in DATA_INVENTORY.md, plus IP | None | Yes, for forms |
| Google Maps Embed | Map on Contact page | Only after the visitor clicks **Accept**, and only on `/contact` | IP, user agent, referrer; Google may set cookies | Possibly (Google) | No: consent-gated |
| Google Maps link | "Open in Google Maps" button | Only if clicked (navigates to google.com) | Whatever the visitor sends Google | Google's own | Visitor's choice |
| Supabase | Portal database, sign-in, files | Portal pages; public forms post consent/deletion records server-side | Account and job data | `sb-*` auth cookies after sign-in | Yes, for portal |
| Resend | Invoice and notification email | Server side only | Recipient email, email content, invoice PDF | None on site | Yes, for portal |
| Stripe | Online invoice payment | Payment links / checkout only, on Stripe's domain | Payer details entered on Stripe's page; invoice number and amount from us | Stripe's own on its domain | Yes, for online payment |
| Web Push (browser push service: Google/Apple/Mozilla) | Phone/desktop alerts in the portal | Only after a signed-in user presses "Turn on alerts" | Alert title/body, encrypted | None | Opt-in |
| Google Maps Embed (driver app) | Route map on a driver's load | Driver portal only, when a key is set | Pickup/drop-off text, IP | Possibly (Google) | Operational; drivers can use the plain Google Maps link instead |
| Vercel Cron | Daily job | Server only | None | None | Yes |

**Analytics:** none. **Ads / pixels:** none. **Fonts:** self-hosted (no Google Fonts requests).

Re-run this audit whenever a package that runs in the browser is added: `npm ls --depth=0` and check the Network tab with a fresh browser profile before accepting cookies.

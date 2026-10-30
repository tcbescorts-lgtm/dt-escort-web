# Feature research: ideas borrowed from fleet and dispatch apps

Short review done before building the portal. Each idea lists where it's common and what we built.

| Idea | Seen in | What we built |
|---|---|---|
| Proof of delivery with photo and signature capture in the driver app | Onfleet driver app and proof-of-delivery features; Super Dispatch ePOD/BOL app | Run sheet photo/receipt uploads, signed delivery ticket upload, and driver + customer signature pads |
| Document storage per driver with expiration reminders | Motive driver qualification documents and expiration notifications | Driver document vault (private storage), certifications with expiry dates, 60/30/7-day alerts to office and driver, dashboard "Expiring in 60 days" panel |
| Driver status / availability board | Common in dispatch tools (e.g. Super Dispatch, TMS products) | Status picker right after driver sign-in; live status board on the dashboard |
| Load assignment notifications to the driver's phone | Onfleet, Motive driver apps | In-app alert (database trigger), email, and optional web push on assignment; driver must acknowledge |
| Offline-tolerant driver forms | Onfleet and most mobile driver apps | Run sheet autosaves to the phone and restores after signal returns; offline page via service worker |
| Invoicing from the completed job, tracked delivery, online payment | Super Dispatch (invoicing + payments), most TMS tools | Invoice from run sheet in one click, PDF, email with delivery/open tracking (Resend webhooks), Stripe payment link with automatic "paid" |
| Broker payment-speed tracking | Load-board / factoring culture in trucking | Average days to pay on each customer, from invoice date to paid |
| Daily summary for the owner | Fleet dashboards | Daily digest email from the scheduled job |
| Full audit trail | Enterprise fleet tools | Database-level audit log of every change plus sensitive-field views |

Evaluated but not built yet (say the word and they can be added):
- **State-by-state escort rules reference.** Needs each rule verified against official state DOT sources with a last-verified date; worth doing carefully rather than quickly.
- **Twilio SMS.** Not free; email + web push cover alerts for now.
- **Mileage from Google Directions API.** Paid beyond the free tier; the free Maps Embed and Google Maps links are used instead.
- **Customer portal with quote history** and **e-signature for contracts.**
- **Driver vacation calendar.** Status "On a vacation" covers the basic need today.

Sources:
- Onfleet proof of delivery: https://onfleet.com/proof-of-delivery
- Onfleet driver app: https://onfleet.com/driver-app
- Motive driver app and fleet operations: https://gomotive.com/blog/how-the-motive-driver-app-supports-fleet-operations/
- Motive qualification document expiration notifications: https://helpcenter.gomotive.com/hc/en-us/articles/21379955065245-Can-Fleets-or-Drivers-Get-Notified-of-Upcoming-Qualification-Document-Expirations
- Super Dispatch dispatching software features: https://superdispatch.com/blog/dispatching-software/
- Super Dispatch BOL app (ePOD): https://apps.apple.com/app/id921598152

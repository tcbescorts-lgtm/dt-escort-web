# D & T Portal: admin guide

Sign in at **https://dtescortservice.com/login**. Owners and admins land on the dashboard; drivers land on their status picker.

## Every day
1. **Dashboard**: check the driver status board, notifications, to-dos and anything expiring in the next 60 days.
2. **Book a load**: paste the broker's notes into the box and press **Fill the form**. Check every field (the parser is a helper, not a decision-maker), pick the pilot, and press **Save load**. The pilot gets an in-app alert, an email, and a phone alert if they turned alerts on.
3. **Run sheets**: drivers submit these after the run. Open each one under *Waiting for review*, correct anything, add a comment if needed, and press **Approve**. To send it back, use **Reopen as draft** with a note.
4. **Invoices**: from an approved run sheet press **Create invoice**. Check the lines, **Save invoice**, then **Send invoice** (emails the PDF and a link). Add an online payment link first if the customer wants to pay by card or bank.
5. When money arrives by ACH, Zelle, CashApp or check, open the invoice and **Record payment**. Online (Stripe) payments mark themselves paid.

## Paying drivers
**Driver runs** shows each driver's runs for a pay period in the same columns as the old tracking sheet: load total, paid to driver, gas, QP fee, profit, client type, company and invoice number.
- Driver pay = (load total − QP fee − gas) × the driver's split %.
- Set the split on the driver's profile. It's locked into each run sheet when you approve it.
- Tick the runs, enter cash advances, **Create pay statement**, then **Mark paid** after you send the money. Drivers see their statements under **Pay**.

## Adding a driver
**Drivers → Add driver**. Leave the temporary password blank so the portal makes a unique one, then press **Copy message** and text it to the driver. They must choose their own password the first time they sign in. Use **Issue a new temporary password** on their profile if they get locked out.

Sensitive details (date of birth, license number, VIN) stay hidden until you press **Show sensitive details**. Every view is written to the audit log.

## Owner only
- **Reports**: revenue, receivables, driver earnings, customer profitability, miles, all exportable to CSV.
- **Settings → Users and roles**: add office users, change roles, turn accounts off.
- **Settings → Audit log**: who changed what, and when.

## Privacy duties
- **Settings → Data deletion queue**: website deletion requests land here. Email the person to verify, delete their records, write what was deleted or kept (invoices must be kept for tax law), and mark complete within 30 days.
- The suppression list stops non-essential email to anyone who unsubscribed or complained.

## Exports for the accountant
- **Invoices → Export invoices (CSV)**: one row per line item, in QuickBooks Online's invoice-import layout.
- **Invoices → Export payments (CSV)**, **Driver runs → Export CSV**, and the CSV links on **Reports**.

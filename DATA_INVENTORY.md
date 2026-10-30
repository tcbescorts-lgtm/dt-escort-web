# Data inventory

Every piece of personal data the system collects, why, where it goes, and how long it stays. Update this file whenever a field is added or removed.

## Public website forms (live in Phase 3)

All three forms are sent from the visitor's browser to Web3Forms, which emails them to dtescortservice@gmail.com. Nothing is stored in our own database yet. The consent checkbox is never pre-checked and is required. A hidden honeypot field (`botcheck`) catches spam bots; it holds no personal data.

### Quote request (`/quote`)
| Field | Required | Why we collect it |
|---|---|---|
| Name | Yes | To know who we're quoting |
| Phone | Yes | Dispatch calls back on most jobs |
| Email | Yes | To send the quote in writing |
| Pick up | Yes | Needed to price the miles |
| Drop off | Yes | Needed to price the miles |
| Date | Yes | To check operator availability |
| Notes | No | Load height, width, length, weight and cargo type decide which positions and certifications are needed |
| Consent | Yes | Records that the person asked to be contacted |

### Driver interest (`/careers`)
| Field | Required | Why |
|---|---|---|
| Name, Phone, Email | Yes | To contact the applicant |
| Home state | Yes | We assign work by location |
| Certifications | No | Shows which states they can run |
| Anything else | No | Positions, equipment, availability |
| Consent | Yes | Records that they asked to be contacted |

The form tells applicants not to send license numbers, dates of birth or SSNs.

### Data deletion request (`/data-deletion`)
| Field | Required | Why |
|---|---|---|
| Name, Email | Yes | To find their records and verify by email |
| What to delete | Yes | Scope of the request |
| Details | No | Helps find records |
| Verification acknowledgment | Yes | They agree we'll email them to confirm before deleting |

Response time: 30 days after verification.

## Browser storage (public site)
| Key | Purpose | Essential? |
|---|---|---|
| `dt-theme` | Remembers dark/light mode | Yes (user preference) |
| `dt-consent` | Remembers cookie choice, version and date | Yes |

## Public forms also write to the portal database
- Quote and careers forms: a consent record (email, purpose, time) in `consent_log`.
- Deletion form: the request in `deletion_requests` (name, email, scope, details) so it can be tracked to completion within 30 days.

## Portal data
| Table | Personal data | Why | Who can see it |
|---|---|---|---|
| profiles | Name, email, phone, role | Sign-in and permissions | Self; owner/admin |
| drivers | Name, phone, email, home address, emergency contact, employment type, start date, positions, split %, license state/class/expiry, equipment, payment method + last 4 only, notes | Dispatching, state compliance, paying drivers | Owner/admin; the driver sees their own row |
| driver_internal | Rating / performance notes | Internal management | Owner/admin only (drivers have no access) |
| driver_private | Date of birth, driver license number, VIN | Required by some states/customers | Owner/admin only, through audited functions |
| vehicles, certifications, driver_documents | Vehicle details, certification/permit numbers, insurance, W-9 and agreement files | Compliance and expiry alerts | Owner/admin; driver sees own |
| customers, customer_rate_cards | Business contacts, billing email/phone | Booking and invoicing | Owner/admin; a driver sees only the company/contact on their assigned loads, never rates |
| loads | Truck driver name and phone, route, cargo dimensions | Running the escort | Owner/admin; assigned drivers |
| run_sheets (+ legs, files, events) | Trip details, odometer, times, optional GPS stamps (only when the driver taps to share), signatures, receipts and photos | Billing and records | Owner/admin; the driver who wrote it |
| invoices, invoice_items, payments, email_events | Bill-to name/email, amounts, payment references | Billing and collections | Owner/admin |
| driver_settlements | Pay periods, cash advances, payout references | Paying drivers | Owner/admin; driver sees own |
| notifications, push_subscriptions | Alert text; browser push endpoint | Alerts | The user it belongs to |
| todos | Task text | Office work | Owner/admin |
| login_attempts | Email + success flag + time | Lockout after repeated failures | Server only |
| audit_log | Who changed what | Accountability | Owner only |
| consent_log, deletion_requests, suppression_list | Email, purpose | Legal compliance | Owner/admin |

Never collected: Social Security numbers, card numbers, full bank account numbers.

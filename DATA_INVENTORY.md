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

## Portal (Phase 4 onward)
Will be filled in table by table as the schema is built. Rules decided now:
- No SSNs anywhere. No card numbers (Stripe holds them).
- Driver DOB, license number and VIN are visible to owner and admin only, encrypted at rest where practical, and every view or edit is written to `audit_log`.
- Payment account details are masked (last 4 only).

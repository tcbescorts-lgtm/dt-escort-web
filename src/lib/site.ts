/**
 * Single source of truth for business facts shown on the public site.
 * Every public claim lives here with its verification status.
 * See CLAIMS_REVIEW.md before changing anything in this file.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://dtescortservice.com";

export const company = {
  name: "D & T Escort Service",
  legalName: "D & T Escort Service LLC",
  street: "3897 I-55 S",
  city: "Jackson",
  region: "MS",
  regionName: "Mississippi",
  postalCode: "39212",
  country: "US",
  email: "dtescortservice@gmail.com",
  phoneDisplay: "(601) 706-3404",
  phoneE164: "+16017063404",
  telHref: "tel:+16017063404",
  hours: "Dispatch answers 24 hours a day, 7 days a week",
} as const;

export const fullAddress = `${company.street}, ${company.city}, ${company.region} ${company.postalCode}`;

/**
 * Claims confirmed by the business (owner/ops) on 2026-10-29.
 * `proof` lists the document that should be on file before launch.
 */
export const claims = {
  coverage48: { text: "All 48 contiguous states", confirmed: true, proof: "Operator certifications covering each state's requirements" },
  insurance1m: { text: "$1,000,000 insurance", confirmed: true, proof: "Current certificate of insurance (COI)" },
  certified: { text: "PEVO-certified pilot car operators", confirmed: true, proof: "Copies of each operator's PEVO / state certifications" },
  available247: { text: "24/7 dispatch", confirmed: true, proof: "Business statement" },
} as const;

export const positions = [
  {
    slug: "lead",
    name: "Lead escort",
    aka: "Front escort, lead car",
    publicPrimary: true,
    summary:
      "Runs ahead of the load to warn oncoming traffic, watch for clearance problems, and call hazards back to the truck driver before the load reaches them.",
  },
  {
    slug: "chase",
    name: "Chase escort",
    aka: "Rear escort, chase car",
    publicPrimary: true,
    summary:
      "Follows the load to protect it from overtaking traffic, watch the trailer and load through turns and lane changes, and help the driver merge and change lanes.",
  },
  {
    slug: "high-pole",
    name: "High pole escort",
    aka: "Height pole car",
    publicPrimary: false,
    summary:
      "A lead car fitted with an adjustable height pole set just above the load's height, so overhead obstacles are found by the pole before they are reached by the load.",
  },
  {
    slug: "steer",
    name: "Steer car",
    aka: "Steerman, rear steer",
    publicPrimary: false,
    summary:
      "Supports long loads with steerable rear trailers, coordinating with the tillerman or steer operator through tight turns and intersections.",
  },
  {
    slug: "third-car",
    name: "3rd car",
    aka: "Additional escort",
    publicPrimary: false,
    summary:
      "An additional escort for wide or long loads when the permit or route calls for more than a front and rear car, often to hold traffic at intersections or bridges.",
  },
  {
    slug: "route-survey",
    name: "Route survey",
    aka: "Pre-trip survey",
    publicPrimary: false,
    summary:
      "Drives the permitted route before the move to check bridge and overhead clearances, turns, construction and other problems the load could meet.",
  },
] as const;

/** Full list (mobile menu, footer). `top` marks items shown in the desktop header. */
export const nav = [
  { top: true, href: "/services", label: "Services" },
  { top: true, href: "/what-we-escort", label: "What we escort" },
  { top: true, href: "/coverage", label: "Coverage" },
  { top: true, href: "/safety", label: "Safety" },
  { top: false, href: "/how-it-works", label: "How it works" },
  { top: false, href: "/about", label: "About" },
  { top: true, href: "/faq", label: "FAQ" },
  { top: true, href: "/contact", label: "Contact" },
] as const;

export const legalNav = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/data-deletion", label: "Data deletion request" },
] as const;

export const STATES_48 = [
  ["AL", "Alabama"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"],
  ["GA", "Georgia"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
  ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"],
  ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"],
  ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

/** Legal pages are drafts until reviewed by a licensed attorney. */
export const LEGAL = {
  /** Shows a "draft" notice and highlights on the policy pages. Off for the live site; attorney review is tracked in README.md. */
  isDraft: false,
  lastUpdated: "October 30, 2026",
  effectiveDate: "October 30, 2026",
  deletionResponseDays: 30,
};

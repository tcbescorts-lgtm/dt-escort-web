/** Public copy that is reused across pages. Plain facts only. */

export const cargoGroups: { id: string; title: string; note: string; items: string[] }[] = [
  {
    id: "cranes",
    title: "Cranes and lifting equipment",
    note: "Cranes often move as several permitted loads at once: the carrier, boom, and counterweights.",
    items: ["Mobile cranes", "Crawler cranes", "Boom sections", "Counterweights"],
  },
  {
    id: "wind",
    title: "Wind energy",
    note: "Blades are among the longest loads on the road and usually need escorts front and rear, sometimes a steer car.",
    items: ["Wind turbine blades", "Tower sections", "Nacelles", "Hubs"],
  },
  {
    id: "power",
    title: "Power and utility",
    note: "Heavy, tall and often routed around bridges with weight limits.",
    items: ["Transformers", "Substation equipment", "Large generators and turbines", "Utility poles and towers"],
  },
  {
    id: "construction",
    title: "Construction and infrastructure",
    note: "Long beams and precast pieces need room through turns and careful timing at intersections.",
    items: ["Bridge beams and girders", "Precast concrete", "Pipe and structural steel", "Prefab buildings"],
  },
  {
    id: "housing",
    title: "Homes and buildings",
    note: "Wide, tall and often moved on rural roads with tight clearances.",
    items: ["Modular homes", "Manufactured and mobile homes", "Building and house moves"],
  },
  {
    id: "energy",
    title: "Oil, gas and process equipment",
    note: "Rig components and vessels move between yards, plants and well sites.",
    items: ["Oil field and drilling rigs", "Pressure vessels and tanks", "Industrial machinery and presses"],
  },
  {
    id: "equipment",
    title: "Heavy and agricultural equipment",
    note: "Wide machines that ride on lowboys, often over a mix of highways and county roads.",
    items: ["Excavators", "Dozers", "Graders", "Mining equipment", "Combines and agricultural machinery"],
  },
  {
    id: "specialty",
    title: "Specialty and oversized",
    note: "Loads that need extra planning, more escorts, or both.",
    items: [
      "Boats and yachts",
      "Aircraft parts and fuselages",
      "Military and government equipment",
      "Superloads and multi-axle trailer loads",
    ],
  },
];

export const steps = [
  {
    title: "Request",
    text: "Call dispatch or send a quote request with pickup, drop-off, date and the load's dimensions.",
  },
  {
    title: "Route review",
    text: "We read the permitted route and dimensions, confirm which positions the permits call for, and give you a price.",
  },
  {
    title: "Dispatch",
    text: "We assign certified operators, share their contact details with the truck driver, and confirm the meet time and place.",
  },
  {
    title: "Delivery",
    text: "Escorts stay with the load to the drop-off. You get an invoice with the miles and charges for the run.",
  },
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "Which states do you cover?",
    a: "All 48 contiguous states. We're based in Jackson, Mississippi, and run escorts coast to coast.",
  },
  {
    q: "When can I reach dispatch?",
    a: "Any time. Dispatch answers 24 hours a day, 7 days a week, including nights, weekends and holidays.",
  },
  {
    q: "What escort positions do you provide?",
    a: "Lead (front) and chase (rear) escorts, plus high pole, steer car, 3rd car and route survey when the permit or route calls for them.",
  },
  {
    q: "Are your operators certified?",
    a: "Yes. Our pilot car operators hold PEVO certification, and we assign operators who hold the certifications required by the states on your route.",
  },
  {
    q: "Are you insured?",
    a: "Yes, we carry $1,000,000 in insurance. Ask dispatch if you need a certificate of insurance for a job.",
  },
  {
    q: "Do you get the oversize permits?",
    a: "No. We provide escorts only. The carrier or permit service gets the permits, and we run to the route and conditions on them.",
  },
  {
    q: "How is a job priced?",
    a: "Most runs are priced per mile or at a day rate. Overnights, no-go trips (when a move is cancelled after we arrive) and short mini runs are billed at set rates. We confirm the rates with you before the run.",
  },
  {
    q: "What should I have ready when I call?",
    a: "Pickup and drop-off, the load date, the load's height, width, length and weight, the permitted route, and the truck driver's name and phone number.",
  },
];

export const equipment = [
  "Amber warning lights",
  "OVERSIZE LOAD signs",
  "Red or orange warning flags",
  "Height pole (for high pole runs)",
  "CB radio and cell phone",
  "Fire extinguisher",
  "First aid kit",
  "Traffic cones",
  "High-visibility safety vests",
];

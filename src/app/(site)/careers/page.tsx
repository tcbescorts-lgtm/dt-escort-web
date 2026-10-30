import CareersClient from "./CareersClient";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Careers: Pilot Car Operator Jobs",
  description:
    "Certified pilot car operators: let D & T Escort Service know you're interested in escort work. Short form, no sensitive documents needed.",
  path: "/careers",
});

export default function Careers() {
  return <CareersClient />;
}

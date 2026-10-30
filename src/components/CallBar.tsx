import Link from "next/link";
import { company } from "@/lib/site";
import { PhoneIcon } from "./Icons";

/** Sticky bottom bar on phones: call dispatch in one tap. */
export default function CallBar() {
  return (
    <nav aria-label="Quick contact" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-rule bg-bg/95 p-2.5 backdrop-blur md:hidden">
      <a href={company.telHref} className="btn btn-gold w-full whitespace-nowrap !px-2">
        <PhoneIcon /> Call Dispatch
      </a>
      <Link href="/quote" className="btn btn-line w-full whitespace-nowrap !px-2">
        Request a Quote
      </Link>
    </nav>
  );
}

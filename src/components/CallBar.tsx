import { company } from "@/lib/site";
import { PhoneIcon } from "./Icons";

/** One phone button, fixed at the lower left on every public page. */
export default function CallBar() {
  return (
    <a
      href={company.telHref}
      aria-label={`Call dispatch, ${company.phoneDisplay}`}
      title={`Call dispatch ${company.phoneDisplay}`}
      className="fixed bottom-4 left-4 z-30 grid h-13 w-13 place-items-center rounded-lg border-2 border-gold-edge bg-gold-fill text-on-gold shadow-[0_8px_24px_-6px_rgba(0,0,0,0.55)] hover:brightness-110 md:bottom-6 md:left-6"
    >
      <PhoneIcon size={24} />
    </a>
  );
}
